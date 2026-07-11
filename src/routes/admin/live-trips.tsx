import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import {
  Bus,
  Hotel,
  User,
  Phone,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  MapPin,
  Calendar,
  Layers,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export const Route = createFileRoute('/admin/live-trips')({
  component: LiveTripsOperations,
})

interface ChecklistItem {
  id: string
  label: string
  completed: boolean
}

function LiveTripsOperations() {
  const [selectedDepartureId, setSelectedDepartureId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // 1. Fetch upcoming departures happening in the next 30 days
  const { data: activeDepartures = [], isLoading: departuresLoading } = useQuery({
    queryKey: ['live_ops_departures'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]
      // Try fetching departures with fallback to trip_batches
      try {
        const { data, error } = await supabase
          .from('departures')
          .select('*, journeys(name, duration)')
          .gte('departure_date', today)
          .order('departure_date', { ascending: true })

        if (!error && data) return data
      } catch (e) {
        console.warn('Modern departures fetch failed, falling back to trip_batches:', e)
      }

      // Legacy fallback
      const { data: legacy, error: legacyErr } = await supabase
        .from('trip_batches')
        .select('*, journeys(name, duration)')
        .gte('departure_date', today)
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

  // Set first departure as default if none selected
  if (activeDepartures.length > 0 && !selectedDepartureId) {
    setSelectedDepartureId(activeDepartures[0].id)
  }

  const selectedDeparture = activeDepartures.find(d => d.id === selectedDepartureId)

  // 2. Fetch bookings/travellers for this departure
  const { data: travellers = [], isLoading: travellersLoading } = useQuery({
    queryKey: ['live_ops_travellers', selectedDepartureId],
    queryFn: async () => {
      if (!selectedDepartureId) return []
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('departure_id', selectedDepartureId)
        .neq('booking_status', 'CANCELLED')

      if (error || !data) return []
      return data
    },
    enabled: !!selectedDepartureId
  })

  // 3. Dynamic seat map generator
  const totalCapacity = selectedDeparture?.max_capacity || 18
  const seatLayoutRows = Math.ceil(totalCapacity / 4)
  const occupiedSeats = travellers.map((t, idx) => ({
    seatNo: idx + 1,
    name: t.traveller_name,
    gender: t.traveller_gender || 'M',
    phone: t.traveller_phone,
    isWhatsapp: t.is_whatsapp,
    status: t.payment_status,
    total: t.total_amount,
  }))

  // 4. Checklist state tracker (stored locally for demo/op capability)
  const [checklist, setChecklist] = useState<Record<string, ChecklistItem[]>>({
    default: [
      { id: '1', label: 'RTO Vehicle Permit Dispatch', completed: true },
      { id: '2', label: 'Driver Verification & Advance Paid', completed: false },
      { id: '3', label: 'Trip Captain Kit & Meds Bag Ready', completed: true },
      { id: '4', label: 'Hotel Room Vouchers Dispatched', completed: false },
      { id: '5', label: 'Forest Entry Trek Permits Booked', completed: false },
    ]
  })

  const toggleChecklist = (depId: string, itemId: string) => {
    const list = checklist[depId] || checklist.default
    const updated = list.map(item => item.id === itemId ? { ...item, completed: !item.completed } : item)
    setChecklist({ ...checklist, [depId]: updated })
    toast.success('Checklist updated successfully!')
  }

  const currentChecklist = selectedDepartureId ? (checklist[selectedDepartureId] || checklist.default) : []

  // Sharing rooms aggregator
  const doubleSharingList = travellers.filter(t => t.sharing_type === 'DOUBLE')
  const tripleSharingList = travellers.filter(t => t.sharing_type === 'TRIPLE')
  const quadSharingList = travellers.filter(t => t.sharing_type === 'QUAD')

  // Total balance pending collections
  const totalPendingBalance = travellers
    .filter(t => t.payment_status !== 'PAID')
    .reduce((sum, t) => sum + (t.total_amount - (t.amount_paid || 0)), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-poppins text-primary flex items-center gap-2">
          <Layers className="h-6 w-6 text-[#C8A96A]" /> Trip Operations Center
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Real-time operations dispatch, room allocations, vehicle seats map, and pre-departure verification checks.
        </p>
      </div>

      {/* Select departure selector */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Departures Checklist side panel */}
        <div className="md:w-80 shrink-0 space-y-3">
          <Card className="border border-border shadow-none">
            <CardHeader className="p-4 border-b">
              <CardTitle className="text-sm font-bold font-poppins">Departures Calendar List</CardTitle>
              <CardDescription className="text-xs">Select active dispatch departure date</CardDescription>
            </CardHeader>
            <CardContent className="p-3 space-y-1 max-h-[500px] overflow-y-auto">
              {departuresLoading ? (
                <div className="p-4 text-center text-xs text-muted-foreground">Loading active list...</div>
              ) : activeDepartures.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground italic">No upcoming departures.</div>
              ) : (
                activeDepartures.map((dep) => {
                  const isSelected = selectedDepartureId === dep.id
                  return (
                    <button
                      key={dep.id}
                      onClick={() => setSelectedDepartureId(dep.id)}
                      className={`w-full text-left p-3 rounded-xl border text-xs font-poppins transition-all flex flex-col gap-1.5 ${
                        isSelected
                          ? 'border-[#C8A96A] bg-[#C8A96A]/5 font-bold shadow-sm'
                          : 'border-border bg-white hover:bg-muted/40 text-muted-foreground'
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="font-bold text-slate-800 truncate max-w-[140px]">
                          {dep.journeys?.name || 'Group Package'}
                        </span>
                        <Badge className="bg-primary/10 text-primary text-[9px] hover:bg-primary/10">
                          {dep.available_seats} Seats Left
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <Calendar className="h-3 w-3 shrink-0" />
                        <span>
                          {new Date(dep.departure_date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </button>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Dynamic dispatch central command screens */}
        <div className="flex-1 space-y-6">
          {selectedDeparture ? (
            <div className="space-y-6">
              
              {/* Trip stats card overview */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Card className="border border-border shadow-none">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-muted-foreground font-poppins uppercase font-semibold">Total Travellers</p>
                      <p className="text-xl font-bold font-poppins">{travellers.length} / {totalCapacity}</p>
                    </div>
                    <User className="h-6 w-6 text-primary" />
                  </CardContent>
                </Card>

                <Card className="border border-border shadow-none">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-muted-foreground font-poppins uppercase font-semibold">Pending Payments</p>
                      <p className="text-xl font-bold font-poppins text-[#E53E3E]">
                        ₹{totalPendingBalance.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <AlertCircle className="h-6 w-6 text-[#E53E3E]" />
                  </CardContent>
                </Card>

                <Card className="border border-border shadow-none">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-muted-foreground font-poppins uppercase font-semibold">Trip Leader</p>
                      <p className="text-xs font-bold font-poppins truncate max-w-[120px]">Capt. Rohit Sharma</p>
                    </div>
                    <ShieldCheck className="h-6 w-6 text-emerald-600" />
                  </CardContent>
                </Card>

                <Card className="border border-border shadow-none">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-muted-foreground font-poppins uppercase font-semibold">Driver Status</p>
                      <p className="text-xs font-bold font-poppins text-emerald-600">Assigned & Verified</p>
                    </div>
                    <Bus className="h-6 w-6 text-emerald-600" />
                  </CardContent>
                </Card>
              </div>

              {/* Seat Map & Room Sharing configuration row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 1. Interactive Bus Seats Map */}
                <Card className="border border-border shadow-none">
                  <CardHeader className="p-4 border-b">
                    <CardTitle className="text-sm font-bold font-poppins flex items-center gap-1.5">
                      <Bus className="h-4 w-4" /> Live Seat Occupancy Registry
                    </CardTitle>
                    <CardDescription className="text-xs">AC pushback traveller seat allocations layout</CardDescription>
                  </CardHeader>
                  <CardContent className="p-5">
                    {/* Bus Dashboard indicator */}
                    <div className="border rounded-2xl p-4 bg-[#F8F7F3]/40 border-border space-y-4">
                      {/* Driver Cockpit */}
                      <div className="flex justify-between items-center pb-3 border-b border-dashed">
                        <div className="w-9 h-9 rounded bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                          🛞 Driver
                        </div>
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">Cockpit Entrance</div>
                      </div>

                      {/* Seats rows grid representation */}
                      <div className="space-y-3">
                        {Array.from({ length: seatLayoutRows }).map((_, rowIndex) => (
                          <div key={rowIndex} className="grid grid-cols-4 gap-2">
                            {Array.from({ length: 4 }).map((_, colIndex) => {
                              const seatNumber = rowIndex * 4 + colIndex + 1
                              if (seatNumber > totalCapacity) return <div key={colIndex} />
                              
                              const occupancy = occupiedSeats.find(s => s.seatNo === seatNumber)
                              const isWindow = colIndex === 0 || colIndex === 3
                              
                              return (
                                <div
                                  key={colIndex}
                                  className={`border rounded-lg p-2.5 text-center flex flex-col justify-center items-center h-16 cursor-pointer transition-all ${
                                    occupancy
                                      ? 'bg-[#163A5F] text-white border-[#163A5F] shadow-sm'
                                      : 'bg-white border-border hover:border-[#C8A96A] text-slate-700'
                                  }`}
                                  title={occupancy ? `${occupancy.name} - ${occupancy.phone}` : 'Available seat'}
                                >
                                  <span className="text-[10px] font-bold block leading-none">Seat {seatNumber}</span>
                                  {occupancy ? (
                                    <span className="text-[8px] truncate max-w-[50px] font-poppins block mt-1 font-semibold leading-tight">
                                      {occupancy.name.split(' ')[0]}
                                    </span>
                                  ) : (
                                    <span className="text-[8px] text-muted-foreground block mt-1">
                                      {isWindow ? 'Window' : 'Aisle'}
                                    </span>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 2. Hotel Rooming allocation list */}
                <Card className="border border-border shadow-none">
                  <CardHeader className="p-4 border-b">
                    <CardTitle className="text-sm font-bold font-poppins flex items-center gap-1.5">
                      <Hotel className="h-4 w-4" /> Hotel Room Sharing Registry
                    </CardTitle>
                    <CardDescription className="text-xs">Hotel room grouping based on customer checkout request</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    
                    {/* Double Sharing rooms */}
                    <div className="space-y-2">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-primary flex justify-between items-center">
                        <span>Double Sharing Group</span>
                        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 text-[9px]">
                          {doubleSharingList.length} Guests
                        </Badge>
                      </h4>
                      {doubleSharingList.length === 0 ? (
                        <p className="text-[10px] text-muted-foreground italic pl-2">No double sharing groups.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {doubleSharingList.map((t, idx) => (
                            <div key={idx} className="border p-2.5 rounded-lg text-xs font-poppins bg-[#F8F7F3]/40 flex flex-col justify-between">
                              <span className="font-bold text-slate-800">{t.traveller_name}</span>
                              <span className="text-[9px] text-muted-foreground mt-1">Room {Math.ceil((idx + 1) / 2)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Triple Sharing rooms */}
                    <div className="space-y-2 border-t pt-3">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-primary flex justify-between items-center">
                        <span>Triple Sharing Group</span>
                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 text-[9px]">
                          {tripleSharingList.length} Guests
                        </Badge>
                      </h4>
                      {tripleSharingList.length === 0 ? (
                        <p className="text-[10px] text-muted-foreground italic pl-2">No triple sharing groups.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {tripleSharingList.map((t, idx) => (
                            <div key={idx} className="border p-2.5 rounded-lg text-xs font-poppins bg-[#F8F7F3]/40 flex flex-col justify-between">
                              <span className="font-bold text-slate-800">{t.traveller_name}</span>
                              <span className="text-[9px] text-muted-foreground mt-1">Room {Math.ceil((idx + 1) / 3)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Quad Sharing rooms */}
                    <div className="space-y-2 border-t pt-3">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-primary flex justify-between items-center">
                        <span>Quad Sharing Group</span>
                        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-[9px]">
                          {quadSharingList.length} Guests
                        </Badge>
                      </h4>
                      {quadSharingList.length === 0 ? (
                        <p className="text-[10px] text-muted-foreground italic pl-2">No quad sharing groups.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {quadSharingList.map((t, idx) => (
                            <div key={idx} className="border p-2.5 rounded-lg text-xs font-poppins bg-[#F8F7F3]/40 flex flex-col justify-between">
                              <span className="font-bold text-slate-800">{t.traveller_name}</span>
                              <span className="text-[9px] text-muted-foreground mt-1">Room {Math.ceil((idx + 1) / 4)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Dispatch checklist & list of passengers */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Operations Dispatch Checklist */}
                <Card className="border border-border shadow-none lg:col-span-1">
                  <CardHeader className="p-4 border-b">
                    <CardTitle className="text-sm font-bold font-poppins">Departure Checklist</CardTitle>
                    <CardDescription className="text-xs">Must be fully completed before vehicle departure</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    {currentChecklist.map((item) => (
                      <label
                        key={item.id}
                        className="flex items-start gap-2.5 p-2 border rounded-lg cursor-pointer bg-white select-none hover:bg-muted/10"
                      >
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => toggleChecklist(selectedDepartureId!, item.id)}
                          className="mt-0.5 rounded border-border text-[#E53E3E] focus:ring-[#E53E3E]"
                        />
                        <span className={`text-[10px] font-poppins leading-tight ${item.completed ? 'line-through text-muted-foreground font-semibold' : 'text-slate-700'}`}>
                          {item.label}
                        </span>
                      </label>
                    ))}
                  </CardContent>
                </Card>

                {/* Dispatch Crew Details & Passengers list */}
                <Card className="border border-border shadow-none lg:col-span-2">
                  <CardHeader className="p-4 border-b">
                    <CardTitle className="text-sm font-bold font-poppins">Customer Roster</CardTitle>
                    <CardDescription className="text-xs">Emergency numbers, WhatsApp coordinates and payments status</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {travellers.length === 0 ? (
                      <div className="p-6 text-center text-xs text-muted-foreground italic">No travellers registered yet.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs font-poppins">
                          <thead className="bg-[#F8F7F3] border-b text-muted-foreground text-[10px] uppercase font-bold">
                            <tr>
                              <th className="p-3">Name</th>
                              <th className="p-3">Phone</th>
                              <th className="p-3">Age/Sex</th>
                              <th className="p-3">Sharing</th>
                              <th className="p-3">Payment</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {travellers.map((t) => (
                              <tr key={t.id} className="hover:bg-muted/10">
                                <td className="p-3 font-semibold text-slate-800">{t.traveller_name}</td>
                                <td className="p-3">
                                  <div className="flex items-center gap-1">
                                    <span>{t.traveller_phone}</span>
                                    {t.is_whatsapp && <span className="text-[10px]" title="WhatsApp Active">🟢</span>}
                                  </div>
                                </td>
                                <td className="p-3 text-muted-foreground">{t.traveller_age} ({t.traveller_gender?.charAt(0)})</td>
                                <td className="p-3"><Badge variant="secondary" className="text-[9px]">{t.sharing_type}</Badge></td>
                                <td className="p-3">
                                  <Badge className={t.payment_status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>
                                    {t.payment_status}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

            </div>
          ) : (
            <div className="flex h-64 items-center justify-center text-center border-2 border-dashed border-border rounded-2xl bg-white p-5">
              <div className="space-y-2">
                <AlertCircle className="h-10 w-12 text-muted-foreground mx-auto" />
                <h3 className="font-bold text-sm">No Active Departures Selected</h3>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Please select an active upcoming departure from the sidebar list to load the live dispatch seat configurations.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
