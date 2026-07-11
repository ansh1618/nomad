import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowRight,
  Info,
  Calendar,
  Layers,
  MapPin,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export const Route = createFileRoute('/admin/trip-calendar')({
  component: TripCalendarCenter,
})

function TripCalendarCenter() {
  const [currentDate, setCurrentDate] = useState(new Date())

  // 1. Fetch upcoming departures
  const { data: departures = [], isLoading } = useQuery({
    queryKey: ['calendar_departures'],
    queryFn: async () => {
      // Try modern queries first
      try {
        const { data, error } = await supabase
          .from('departures')
          .select('*, journeys(name, duration)')
          .order('departure_date', { ascending: true })

        if (!error && data) return data
      } catch (e) {
        console.warn('Modern departures fetch failed, falling back:', e)
      }

      // Legacy fallback
      const { data: legacy, error: legacyErr } = await supabase
        .from('trip_batches')
        .select('*, journeys(name, duration)')
        .order('departure_date', { ascending: true })

      if (legacyErr || !legacy) return []
      return legacy.map(b => ({
        id: b.id,
        journey_id: b.journey_id,
        departure_date: b.departure_date,
        return_date: b.return_date || b.departure_date,
        base_price: b.price,
        available_seats: b.remaining_seats,
        max_capacity: b.max_capacity,
        journeys: b.journeys
      }))
    }
  })

  // Date helper utilities
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    return new Date(year, month, 1).getDay() // 0 = Sunday, 1 = Monday...
  }

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const daysInMonth = getDaysInMonth(currentDate)
  const firstDayIndex = getFirstDayOfMonth(currentDate)
  const monthName = currentDate.toLocaleString('en-IN', { month: 'long', year: 'numeric' })

  // Construct day numbers grid
  const daysArray = []
  // Empty spaces for previous month's trailing days
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push(null)
  }
  // Current month's days
  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push(i)
  }

  // Selected date's list of departures
  const [selectedDayNo, setSelectedDayNo] = useState<number | null>(new Date().getDate())

  const selectedDateString = selectedDayNo
    ? `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDayNo).padStart(2, '0')}`
    : ''

  const selectedDepartures = departures.filter(dep => {
    const depDateStr = new Date(dep.departure_date).toISOString().split('T')[0]
    return depDateStr === selectedDateString
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-primary flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-[#C8A96A]" /> Operations Trip Calendar
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Operational month calendar overview of scheduled departure dispatches, slots loading and captains rosters.
          </p>
        </div>
        <Link to="/admin/departures/$id" params={{ id: 'new' }}>
          <Button size="sm" className="gap-1.5 text-xs bg-primary">
            <Plus className="h-4 w-4" /> New Departure
          </Button>
        </Link>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Monthly Grid Calendar (8 cols) */}
        <Card className="border border-border shadow-none lg:col-span-8 bg-white">
          <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold font-poppins text-slate-800">{monthName}</CardTitle>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            
            {/* Weekdays names */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] text-muted-foreground font-poppins uppercase pb-2">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {daysArray.map((dayNo, index) => {
                if (dayNo === null) {
                  return <div key={index} className="h-20 bg-muted/10 rounded-lg border border-transparent" />
                }

                // Check if this date has any departures
                const currentDayStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(dayNo).padStart(2, '0')}`
                const dayDeps = departures.filter(dep => {
                  const depDateStr = new Date(dep.departure_date).toISOString().split('T')[0]
                  return depDateStr === currentDayStr
                })

                const isSelected = selectedDayNo === dayNo

                return (
                  <div
                    key={index}
                    onClick={() => setSelectedDayNo(dayNo)}
                    className={`h-24 p-2 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#C8A96A] bg-[#C8A96A]/5'
                        : 'border-border bg-white hover:border-[#C8A96A]/40'
                    }`}
                  >
                    <span className={`text-[10px] font-bold font-poppins ${isSelected ? 'text-primary' : 'text-slate-500'}`}>
                      {dayNo}
                    </span>
                    
                    {/* Departure counts badge indicators inside the grid */}
                    <div className="space-y-1 overflow-hidden mt-1 flex-1 flex flex-col justify-end">
                      {dayDeps.slice(0, 2).map((dep) => (
                        <div
                          key={dep.id}
                          className="bg-primary text-white text-[8px] px-1 py-0.5 rounded font-poppins truncate font-semibold"
                          title={dep.journeys?.name || 'Departure'}
                        >
                          {dep.journeys?.name?.split(' ')[0] || 'Trip'}
                        </div>
                      ))}
                      {dayDeps.length > 2 && (
                        <span className="text-[7px] text-muted-foreground font-poppins font-bold block text-right">
                          +{dayDeps.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

          </CardContent>
        </Card>

        {/* Selected date's departure cards list (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="border border-border shadow-none">
            <CardHeader className="p-4 border-b bg-[#F8F7F3]/40">
              <CardTitle className="text-sm font-bold font-poppins flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-[#C8A96A]" /> Departures on Date
              </CardTitle>
              <CardDescription className="text-xs">
                {selectedDateString ? new Date(selectedDateString).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                }) : 'No date selected'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              
              {isLoading ? (
                <div className="text-center py-6 text-xs text-muted-foreground">Loading calendar data...</div>
              ) : selectedDepartures.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground italic">
                  No dispatches scheduled on this day.
                </div>
              ) : (
                selectedDepartures.map((dep) => (
                  <div key={dep.id} className="border border-border rounded-xl p-4 space-y-3 bg-[#F8F7F3]/10 hover:border-[#C8A96A]/40 transition-colors">
                    <div className="space-y-1">
                      <Badge className="bg-primary/10 text-primary text-[9px] hover:bg-primary/10">
                        {dep.available_seats} Seats Left
                      </Badge>
                      <h4 className="font-bold text-sm text-slate-800 leading-tight">
                        {dep.journeys?.name || 'Group Package'}
                      </h4>
                    </div>

                    <div className="space-y-1.5 text-[10px] text-muted-foreground font-poppins">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        <span>Pickup: 10:00 PM (Delhi Kashmere Gate)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span>Stay: Forest Rest Houses Allocated</span>
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-dashed flex items-center justify-between gap-3">
                      <span className="text-[10px] font-bold text-[#E53E3E] font-poppins">
                        ₹{(dep.base_price || 0).toLocaleString('en-IN')}
                      </span>
                      <Link to="/admin/live-trips" search={{ departureId: dep.id }}>
                        <Button size="sm" variant="outline" className="h-7 text-[9px] font-bold font-poppins gap-1 uppercase hover:bg-primary hover:text-white">
                          Open Ops <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              )}

            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
