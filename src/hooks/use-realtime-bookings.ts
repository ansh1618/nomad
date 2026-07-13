/**
 * useRealtimeBookings
 *
 * Subscribe to Supabase Realtime for the bookings table.
 * When a booking is inserted or updated, invalidates the relevant React Query cache keys.
 *
 * Usage (in admin dashboard):
 *   useRealtimeBookings() // Call once at the top level
 */

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useRealtimeBookings() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('admin-bookings-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bookings' },
        (payload) => {
          console.log('[Realtime] New booking:', payload.new?.booking_id)
          // Invalidate all booking queries
          queryClient.invalidateQueries({ queryKey: ['bookings_list'] })
          queryClient.invalidateQueries({ queryKey: ['dashboard_stats'] })
          queryClient.invalidateQueries({ queryKey: ['monthly_revenue'] })
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bookings' },
        (payload) => {
          console.log('[Realtime] Booking updated:', payload.new?.booking_id, payload.new?.booking_status)
          queryClient.invalidateQueries({ queryKey: ['bookings_list'] })
          queryClient.invalidateQueries({ queryKey: ['dashboard_stats'] })
          // Also invalidate the individual booking detail if open
          if (payload.new?.id) {
            queryClient.invalidateQueries({ queryKey: ['booking_detail', payload.new.id] })
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Realtime] Admin bookings channel subscribed')
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])
}

/**
 * useRealtimeNotifications
 *
 * Subscribe to Supabase Realtime for admin notifications.
 * Used to show live toast notifications when new bookings arrive.
 */
export function useRealtimeNotifications(onNotification?: (title: string, message: string) => void) {
  useEffect(() => {
    const channel = supabase
      .channel('admin-notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: 'recipient_type=eq.ADMIN',
        },
        (payload) => {
          const notif = payload.new
          if (notif && onNotification) {
            onNotification(notif.title, notif.message)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [onNotification])
}
