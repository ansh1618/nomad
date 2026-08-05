import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Users, Tag, AlertCircle } from 'lucide-react'
import type { Departure } from '@/types/supabase'
import { supabase } from '@/lib/supabase'

interface DepartureCalendarViewProps {
  onSelectDeparture?: (departure: Departure) => void
}

type DepartureWithJoins = Departure & {
  journeys?: { id: string; name: string; slug: string }
  trip_captains?: { id: string; full_name: string }
}

export function DepartureCalendarView({ onSelectDeparture }: DepartureCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [journeyFilter, setJourneyFilter] = useState<string>('ALL')

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // First day of current month & total days
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  const startStr = new Date(year, month, 1).toISOString().split('T')[0]
  const endStr = new Date(year, month + 1, 0).toISOString().split('T')[0]

  const { data: journeys = [] } = useQuery({
    queryKey: ['journeys_calendar_filter'],
    queryFn: async () => {
      const { data } = await supabase.from('journeys').select('id, name').order('name')
      return data ?? []
    },
  })

  const { data: departures = [], isLoading } = useQuery({
    queryKey: ['departures_calendar', year, month, journeyFilter],
    queryFn: async () => {
      let q = supabase
        .from('departures')
        .select(`
          *,
          journeys(id, name, slug),
          trip_captains(id, full_name)
        `)
        .gte('departure_date', startStr)
        .lte('departure_date', endStr)
        .order('departure_date', { ascending: true })

      if (journeyFilter !== 'ALL') {
        q = q.eq('journey_id', journeyFilter)
      }

      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as DepartureWithJoins[]
    },
  })

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
  const todayMonth = () => setCurrentDate(new Date())

  // Organize departures by date string YYYY-MM-DD
  const departuresByDate = new Map<string, DepartureWithJoins[]>()
  departures.forEach((dep) => {
    if (dep.departure_date) {
      const dateKey = dep.departure_date.split('T')[0]
      const existing = departuresByDate.get(dateKey) || []
      departuresByDate.set(dateKey, [...existing, dep])
    }
  })

  // Generate calendar grid days
  const startingDayOfWeek = firstDay.getDay() // 0 = Sun
  const daysInMonth = lastDay.getDate()

  const calendarCells = []

  // Blank cells before day 1
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarCells.push({ isBlank: true, dayNum: 0, dateKey: '' })
  }

  // Month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    calendarCells.push({ isBlank: false, dayNum: d, dateKey: dStr })
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  // Status Badge Styling Function
  const getStatusStyle = (dep: DepartureWithJoins) => {
    if (dep.is_cancelled) return 'bg-red-100 text-red-800 border-red-300'
    if (dep.is_closed) return 'bg-gray-100 text-gray-800 border-gray-300'
    if (dep.is_sold_out || dep.available_seats <= 0) return 'bg-rose-500 text-white border-rose-600'
    if (dep.available_seats <= 5) return 'bg-amber-400 text-amber-950 border-amber-500'
    return 'bg-emerald-500 text-white border-emerald-600'
  }

  return (
    <div className="bg-white border border-border rounded-3xl p-6 shadow-sm space-y-6">
      {/* Calendar Header Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
            <CalendarIcon className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-foreground">
              {monthNames[month]} {year}
            </h2>
            <p className="text-xs text-muted-foreground">
              {departures.length} scheduled departures in this view
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Package Filter */}
          <Select value={journeyFilter} onValueChange={setJourneyFilter}>
            <SelectTrigger className="w-[200px] rounded-xl h-10 border-border text-xs">
              <SelectValue placeholder="Filter Package..." />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="ALL">All Packages</SelectItem>
              {journeys.map((j) => (
                <SelectItem key={j.id} value={j.id}>
                  {j.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Month Navigation */}
          <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-xl border">
            <Button type="button" variant="ghost" size="sm" onClick={prevMonth} className="h-8 w-8 p-0 rounded-lg">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={todayMonth} className="h-8 px-2.5 text-xs font-bold rounded-lg">
              Today
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={nextMonth} className="h-8 w-8 p-0 rounded-lg">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Color Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-muted-foreground bg-muted/20 p-3 rounded-2xl border">
        <span className="font-bold uppercase tracking-wider text-[10px]">Legend:</span>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-emerald-500" />
          <span>Seats Available (&gt; 5)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-amber-400" />
          <span>Almost Full (1-5 Seats)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-rose-500" />
          <span>Sold Out (0 Seats)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-red-200 border border-red-400" />
          <span>Cancelled</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="border border-border rounded-2xl overflow-hidden shadow-sm">
        {/* Days Header */}
        <div className="grid grid-cols-7 bg-muted text-muted-foreground font-semibold text-xs text-center border-b uppercase tracking-wider py-2">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Month Cells Grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-border bg-white text-xs">
          {calendarCells.map((cell, idx) => {
            if (cell.isBlank) {
              return <div key={idx} className="min-h-[110px] bg-muted/10 p-2" />
            }

            const dayDeps = departuresByDate.get(cell.dateKey) || []
            const isToday =
              cell.dateKey === new Date().toISOString().split('T')[0]

            return (
              <div
                key={idx}
                className={`min-h-[120px] p-2 flex flex-col justify-between transition ${
                  isToday ? 'bg-amber-50/50 font-bold' : 'hover:bg-muted/10'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`inline-flex items-center justify-center h-6 w-6 rounded-full font-mono text-xs ${
                      isToday ? 'bg-secondary text-white font-bold shadow-sm' : 'text-foreground font-semibold'
                    }`}
                  >
                    {cell.dayNum}
                  </span>
                  {dayDeps.length > 0 && (
                    <span className="text-[10px] font-bold text-muted-foreground">
                      {dayDeps.length} trip{dayDeps.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* Departure Cards List */}
                <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[90px]">
                  {dayDeps.map((dep) => {
                    const badgeClass = getStatusStyle(dep)
                    const title = dep.journeys?.name || 'Trip'

                    return (
                      <div
                        key={dep.id}
                        onClick={() => onSelectDeparture?.(dep)}
                        className={`p-1.5 rounded-xl border text-[11px] font-medium leading-tight cursor-pointer hover:scale-[1.02] transition shadow-2xs ${badgeClass}`}
                        title={`${title} - ₹${dep.base_price.toLocaleString()} (${dep.available_seats}/${dep.total_seats} seats)`}
                      >
                        <div className="font-bold truncate">{title}</div>
                        <div className="flex items-center justify-between text-[10px] opacity-90 mt-0.5 font-mono">
                          <span>₹{dep.base_price.toLocaleString()}</span>
                          <span>{dep.available_seats} left</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
