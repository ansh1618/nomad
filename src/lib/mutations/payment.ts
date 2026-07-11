import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'

// ==========================================
// CREATE RAZORPAY ORDER
// ==========================================
const createOrderSchema = z.object({
  bookingId: z.string(),
  amount: z.number().positive(),
  currency: z.string().default('INR'),
  paymentType: z.enum(['ADVANCE', 'FULL', 'BALANCE']).default('FULL'),
})

export const createRazorpayOrderFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof createOrderSchema>) => createOrderSchema.parse(data))
  .handler(async ({ data }) => {
    const { bookingId, amount, currency, paymentType } = data

    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    if (!keyId || !keySecret) {
      throw new Error('Razorpay credentials not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to environment variables.')
    }

    // Create Razorpay order via REST API
    const credentials = Buffer.from(`${keyId}:${keySecret}`).toString('base64')
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Razorpay uses paise
        currency,
        receipt: bookingId,
        notes: {
          booking_id: bookingId,
          payment_type: paymentType,
        },
      }),
    })

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}))
      throw new Error(`Razorpay order creation failed: ${JSON.stringify(errBody)}`)
    }

    const order = await response.json() as {
      id: string
      amount: number
      currency: string
      receipt: string
    }

    // Create payment record in DB
    const { error: paymentError } = await supabase.from('payments').insert({
      booking_id: bookingId,
      amount,
      currency,
      status: 'PENDING',
      payment_type: paymentType,
      payment_gateway: 'RAZORPAY',
      gateway_order_id: order.id,
    })

    if (paymentError) {
      throw new Error(`Failed to create payment record: ${paymentError.message}`)
    }

    // Update booking with order ID
    await supabase.from('bookings')
      .update({ razorpay_order_id: order.id, updated_at: new Date().toISOString() })
      .eq('id', bookingId)

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
    }
  })

// ==========================================
// VERIFY RAZORPAY PAYMENT
// ==========================================
const verifyPaymentSchema = z.object({
  bookingId: z.string(),
  orderId: z.string(),
  paymentId: z.string(),
  signature: z.string(),
  amountPaid: z.number(),
})

export const verifyRazorpayPaymentFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof verifyPaymentSchema>) => verifyPaymentSchema.parse(data))
  .handler(async ({ data }) => {
    const { bookingId, orderId, paymentId, signature, amountPaid } = data

    const keySecret = process.env.RAZORPAY_KEY_SECRET
    if (!keySecret) throw new Error('Razorpay key secret not configured')

    // Verify signature using HMAC SHA256
    const crypto = await import('crypto')
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex')

    if (expectedSignature !== signature) {
      throw new Error('Payment signature verification failed. Potential fraud detected.')
    }

    // Update payment record
    await supabase.from('payments')
      .update({
        status: 'SUCCESS',
        gateway_payment_id: paymentId,
        gateway_signature: signature,
        gateway_order_id: orderId,
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('gateway_order_id', orderId)

    // Confirm the booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .update({
        status: 'CONFIRMED',
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
        amount_paid: amountPaid,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId)
      .select('id, booking_id, user_id, total_amount, departure_id')
      .single()

    if (bookingError) throw new Error(bookingError.message)

    // Confirm seat/room inventory
    await supabase
      .from('departure_inventory')
      .update({ status: 'BOOKED', booking_id: bookingId })
      .eq('booking_id', bookingId)
      .eq('status', 'LOCKED')

    // Update departure seats count
    const { data: dep } = await supabase
      .from('departures')
      .select('available_seats, booked_seats')
      .eq('id', booking.departure_id)
      .single()

    if (dep) {
      const travellerCount = await supabase
        .from('booking_travellers')
        .select('id', { count: 'exact' })
        .eq('booking_id', bookingId)

      const count = travellerCount.count ?? 1
      await supabase.from('departures')
        .update({
          available_seats: Math.max(0, dep.available_seats - count),
          booked_seats: (dep.booked_seats ?? 0) + count,
          updated_at: new Date().toISOString(),
        })
        .eq('id', booking.departure_id)
    }

    // Increment booking count on journey
    await supabase.rpc('increment', { table_name: 'journeys', field_name: 'booking_count', row_id: booking.departure_id }).catch(() => null)

    return {
      success: true,
      bookingId: booking.id,
      displayId: booking.booking_id,
    }
  })

// ==========================================
// INITIATE REFUND
// ==========================================
const refundSchema = z.object({
  paymentId: z.string(),
  amount: z.number().positive(),
  reason: z.string().optional(),
  bookingId: z.string(),
})

export const initiateRefundFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof refundSchema>) => refundSchema.parse(data))
  .handler(async ({ data }) => {
    const { paymentId, amount, reason, bookingId } = data

    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET
    if (!keyId || !keySecret) throw new Error('Razorpay credentials not configured')

    // Get the gateway payment ID
    const { data: payment } = await supabase
      .from('payments')
      .select('gateway_payment_id')
      .eq('id', paymentId)
      .single()

    if (!payment?.gateway_payment_id) throw new Error('Payment gateway ID not found')

    const credentials = Buffer.from(`${keyId}:${keySecret}`).toString('base64')
    const response = await fetch(`https://api.razorpay.com/v1/payments/${payment.gateway_payment_id}/refund`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100),
        notes: { reason: reason ?? 'Customer requested refund', booking_id: bookingId },
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(`Refund failed: ${JSON.stringify(err)}`)
    }

    const refund = await response.json() as { id: string }

    // Update payment record
    await supabase.from('payments').update({
      status: 'REFUNDED',
      metadata: { refund_id: refund.id, refund_amount: amount, reason },
      updated_at: new Date().toISOString(),
    }).eq('id', paymentId)

    // Update booking
    await supabase.from('bookings').update({
      status: 'REFUNDED',
      refund_amount: amount,
      refund_status: 'COMPLETED',
      updated_at: new Date().toISOString(),
    }).eq('id', bookingId)

    return { success: true, refundId: refund.id }
  })

// ==========================================
// GET DASHBOARD STATS (server fn for SSR)
// ==========================================
export const getDashboardStatsFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    const { data, error } = await supabase.from('v_dashboard_stats').select('*').single()
    if (error) throw new Error(error.message)
    return data
  })

// ==========================================
// GET MONTHLY REVENUE (server fn for SSR)
// ==========================================
export const getMonthlyRevenueFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    const { data, error } = await supabase.from('v_monthly_revenue').select('*')
    if (error) throw new Error(error.message)
    return data ?? []
  })
