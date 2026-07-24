import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { confirmBookingAfterPayment } from '@/lib/booking-api'

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

    const amountInPaise = Math.round(amount * 100)

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency,
        receipt: `rcpt_${bookingId.slice(0, 8)}_${Date.now()}`,
        notes: { booking_id: bookingId, payment_type: paymentType },
      }),
    })

    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.error?.description || 'Failed to create Razorpay order')
    }

    const order = await response.json()

    await supabaseAdmin.from('payments').insert({
      booking_id: bookingId,
      amount,
      currency,
      status: 'Pending',
      payment_type: paymentType,
      gateway: 'razorpay',
      payment_gateway: 'RAZORPAY',
      gateway_order_id: order.id,
    })

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

    // Atomically confirm booking, update statuses, decrements seats, and notifies admin
    await confirmBookingAfterPayment(
      {
        bookingId,
        orderId,
        paymentId,
        signature,
        amountPaid,
        gateway: 'razorpay',
      },
      supabaseAdmin
    )

    // Confirm seat/room inventory
    await supabaseAdmin
      .from('departure_inventory')
      .update({ status: 'BOOKED', booking_id: bookingId })
      .eq('booking_id', bookingId)
      .eq('status', 'LOCKED')

    return {
      success: true,
      message: 'Payment verified and booking confirmed successfully.',
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
