import { supabase } from '@/lib/supabase';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export interface AnalyticsMetricCard {
  title: string;
  value: string;
  trend: string;
  color: string;
  desc: string;
}

export interface MonthlyTrendItem {
  name: string;
  fullDate: string;
  revenue: number;
  bookings: number;
}

export interface DestinationShareItem {
  name: string;
  value: number;
  count: number;
  color: string;
}

export interface AdminAnalyticsData {
  metrics: AnalyticsMetricCard[];
  monthlyTrends: MonthlyTrendItem[];
  destinationShare: DestinationShareItem[];
  totalConfirmedBookingsCount: number;
  periodLabel: string;
}

const BRAND_PIE_COLORS = [
  '#163A5F', // Deep Navy
  '#C8A96A', // Gold
  '#244B3D', // Forest Emerald
  '#5E6B77', // Slate Gray
  '#3B82F6', // Royal Blue
  '#E05688', // Rose Pink
];

export async function getRealAdminAnalytics(periodKey: string = '6m'): Promise<AdminAnalyticsData> {
  const dbClient = getSupabaseAdmin() || supabase;

  // 1. Calculate Date Thresholds for Current & Previous Periods
  const now = new Date();
  let startDate = new Date();
  let periodLabel = 'Last 7 months';

  if (periodKey === '7d') {
    startDate.setDate(now.getDate() - 7);
    periodLabel = 'Last 7 days';
  } else if (periodKey === '30d') {
    startDate.setDate(now.getDate() - 30);
    periodLabel = 'Last 30 days';
  } else if (periodKey === '3m') {
    startDate.setMonth(now.getMonth() - 3);
    periodLabel = 'Last 3 months';
  } else if (periodKey === '6m') {
    startDate.setMonth(now.getMonth() - 6);
    periodLabel = 'Last 7 months';
  } else if (periodKey === '12m') {
    startDate.setFullYear(now.getFullYear() - 1);
    periodLabel = 'Last 12 months';
  } else if (periodKey === 'all') {
    startDate = new Date(2020, 0, 1);
    periodLabel = 'All time';
  } else {
    startDate.setMonth(now.getMonth() - 6);
  }

  startDate.setHours(0, 0, 0, 0);

  // Equivalent previous window for percentage comparison calculation
  const periodDurationMs = now.getTime() - startDate.getTime();
  const prevStartDate = new Date(startDate.getTime() - periodDurationMs);

  // 2. Fetch Bookings, Payments, Departures, and Destinations in parallel
  const [bookingsRes, paymentsRes, departuresRes, destinationsRes, journeysRes] = await Promise.all([
    dbClient
      .from('bookings')
      .select('id, booking_id, customer_name, email, phone, user_id, amount, total_amount, amount_paid, payment_status, booking_status, destination_id, journey_id, created_at, is_deleted')
      .neq('is_deleted', true),
    dbClient
      .from('payments')
      .select('id, booking_id, amount, status, created_at')
      .eq('status', 'SUCCESS'),
    dbClient
      .from('departures')
      .select('id, journey_id, start_date, end_date, status'),
    dbClient
      .from('destinations')
      .select('id, name, slug')
      .neq('is_deleted', true),
    dbClient
      .from('journeys')
      .select('id, title, destination_id')
      .neq('is_deleted', true),
  ]);

  if (bookingsRes.error) {
    console.error("[getRealAdminAnalytics] Bookings fetch error:", bookingsRes.error);
    throw new Error(`Failed to fetch bookings: ${bookingsRes.error.message}`);
  }

  const allBookings = bookingsRes.data ?? [];
  const successPayments = paymentsRes.data ?? [];
  const allDepartures = departuresRes.data ?? [];
  const allDestinations = destinationsRes.data ?? [];
  const allJourneys = journeysRes.data ?? [];

  // Map destination ID to Destination Name
  const destMap = new Map<string, string>();
  allDestinations.forEach((d) => destMap.set(d.id, d.name));

  // Map journey ID to Destination Name
  const journeyDestMap = new Map<string, string>();
  allJourneys.forEach((j) => {
    if (j.destination_id && destMap.has(j.destination_id)) {
      journeyDestMap.set(j.id, destMap.get(j.destination_id)!);
    }
  });

  // Set of booking IDs that have successful payment records
  const confirmedPaymentBookingIds = new Set(
    successPayments.map((p) => p.booking_id).filter(Boolean)
  );

  // Helper to determine if a booking is confirmed/valid paid
  const isConfirmedBooking = (b: any) => {
    if (b.is_deleted) return false;
    const statusUpper = (b.booking_status || b.status || '').toUpperCase();
    const payStatusUpper = (b.payment_status || '').toUpperCase();
    
    if (statusUpper === 'CANCELLED' || statusUpper === 'REFUNDED') return false;
    if (payStatusUpper === 'CANCELLED' || payStatusUpper === 'REFUNDED') return false;

    return (
      statusUpper === 'CONFIRMED' ||
      payStatusUpper === 'COMPLETED' ||
      payStatusUpper === 'PAID' ||
      payStatusUpper === 'SUCCESS' ||
      confirmedPaymentBookingIds.has(b.id) ||
      (Number(b.amount_paid) || 0) > 0
    );
  };

  const confirmedBookings = allBookings.filter(isConfirmedBooking);

  // Helper to get true revenue for a booking
  const getBookingRevenue = (b: any) => {
    const paid = Number(b.amount_paid) || 0;
    if (paid > 0) return paid;
    const total = Number(b.total_amount || b.amount) || 0;
    return total;
  };

  // 3. Filter Current Period vs Previous Period Bookings
  const currentPeriodBookings = confirmedBookings.filter((b) => {
    const createdAt = new Date(b.created_at);
    return createdAt >= startDate && createdAt <= now;
  });

  const prevPeriodBookings = confirmedBookings.filter((b) => {
    const createdAt = new Date(b.created_at);
    return createdAt >= prevStartDate && createdAt < startDate;
  });

  // Revenue calculation
  const currentRevenue = currentPeriodBookings.reduce((sum, b) => sum + getBookingRevenue(b), 0);
  const prevRevenue = prevPeriodBookings.reduce((sum, b) => sum + getBookingRevenue(b), 0);

  // Total Bookings count
  const currentBookingsCount = currentPeriodBookings.length;
  const prevBookingsCount = prevPeriodBookings.length;

  // Completed Trips calculation (from departures)
  const todayIso = now.toISOString();
  const completedDeparturesCount = allDepartures.filter((d) => {
    if (d.status === 'COMPLETED') return true;
    if (d.end_date && d.end_date < todayIso) return true;
    return false;
  }).length;

  // Unique Explorers calculation (deduplicated by customer email/phone/user_id)
  const currentCustomerIdentities = new Set(
    currentPeriodBookings.map((b) => b.email || b.phone || b.user_id || b.customer_name).filter(Boolean)
  );
  const prevCustomerIdentities = new Set(
    prevPeriodBookings.map((b) => b.email || b.phone || b.user_id || b.customer_name).filter(Boolean)
  );

  const currentExplorersCount = currentCustomerIdentities.size;
  const prevExplorersCount = prevCustomerIdentities.size;

  // Growth Rate Calculator Helper
  const calcTrend = (curr: number, prev: number): string => {
    if (prev <= 0) {
      if (curr > 0) return '+100%';
      return '—';
    }
    const diff = ((curr - prev) / prev) * 100;
    return `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`;
  };

  // 4. Construct Metric Cards (3 Cards ONLY — Lead-to-Booking Funnel Removed)
  const metrics: AnalyticsMetricCard[] = [
    {
      title: 'Total Revenue',
      value: `₹${currentRevenue.toLocaleString('en-IN')}`,
      trend: calcTrend(currentRevenue, prevRevenue),
      color: 'text-[#C8A96A]',
      desc: 'Gross Revenue',
    },
    {
      title: 'Total Bookings',
      value: currentBookingsCount.toString(),
      trend: calcTrend(currentBookingsCount, prevBookingsCount),
      color: 'text-blue-600',
      desc: `${completedDeparturesCount} Completed trips`,
    },
    {
      title: 'Active Customers',
      value: currentExplorersCount.toString(),
      trend: calcTrend(currentExplorersCount, prevExplorersCount),
      color: 'text-purple-600',
      desc: 'Unique explorers',
    },
  ];

  // 5. Build Monthly Revenue & Bookings Trend Data
  const monthlyMap = new Map<string, { revenue: number; bookings: number; fullDate: string }>();

  // Determine months to include (e.g. 7 months leading to current month)
  const numMonths = periodKey === '12m' ? 12 : periodKey === '3m' ? 3 : 7;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let i = numMonths - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const name = monthNames[d.getMonth()];
    monthlyMap.set(key, { revenue: 0, bookings: 0, fullDate: `${name} ${d.getFullYear()}` });
  }

  // Populate actual confirmed booking revenue and counts into monthlyMap
  confirmedBookings.forEach((b) => {
    const createdAt = new Date(b.created_at);
    const key = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`;
    if (monthlyMap.has(key)) {
      const entry = monthlyMap.get(key)!;
      entry.revenue += getBookingRevenue(b);
      entry.bookings += 1;
    }
  });

  const monthlyTrends: MonthlyTrendItem[] = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, data]) => {
      const monthIdx = parseInt(key.split('-')[1], 10) - 1;
      return {
        name: monthNames[monthIdx],
        fullDate: data.fullDate,
        revenue: data.revenue,
        bookings: data.bookings,
      };
    });

  // 6. Build Destination Share Pie Chart Data
  const destCounts = new Map<string, number>();

  confirmedBookings.forEach((b) => {
    let destName = 'Other Destinations';
    if (b.destination_id && destMap.has(b.destination_id)) {
      destName = destMap.get(b.destination_id)!;
    } else if (b.journey_id && journeyDestMap.has(b.journey_id)) {
      destName = journeyDestMap.get(b.journey_id)!;
    }

    destCounts.set(destName, (destCounts.get(destName) || 0) + 1);
  });

  const totalConfirmedForPie = confirmedBookings.length;
  let destinationShare: DestinationShareItem[] = [];

  if (totalConfirmedForPie > 0) {
    let colorIdx = 0;
    destinationShare = Array.from(destCounts.entries()).map(([name, count]) => {
      const percentage = Math.round((count / totalConfirmedForPie) * 100);
      const color = BRAND_PIE_COLORS[colorIdx % BRAND_PIE_COLORS.length];
      colorIdx++;
      return {
        name,
        value: percentage,
        count,
        color,
      };
    });
  }

  return {
    metrics,
    monthlyTrends,
    destinationShare,
    totalConfirmedBookingsCount: confirmedBookings.length,
    periodLabel,
  };
}
