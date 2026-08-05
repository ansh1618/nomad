import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Edit3, Loader2, ShieldAlert } from 'lucide-react'
import { bulkUpdateDepartures } from '@/lib/queries/departures'
import { supabase } from '@/lib/supabase'

interface BulkEditDeparturesModalProps {
  isOpen: boolean
  selectedIds: string[]
  onClose: () => void
  onSuccess: () => void
}

export function BulkEditDeparturesModal({ isOpen, selectedIds, onClose, onSuccess }: BulkEditDeparturesModalProps) {
  const [price, setPrice] = useState('')
  const [totalSeats, setTotalSeats] = useState('')
  const [tripCaptainId, setTripCaptainId] = useState('KEEP_CURRENT')
  const [busId, setBusId] = useState('KEEP_CURRENT')
  const [hotelId, setHotelId] = useState('KEEP_CURRENT')
  const [status, setStatus] = useState('KEEP_CURRENT')
  const [isVisible, setIsVisible] = useState<boolean | null>(null)

  const { data: captains = [] } = useQuery({
    queryKey: ['captains_bulk_modal'],
    queryFn: async () => {
      const { data } = await supabase.from('trip_captains').select('id, full_name').order('full_name')
      return data ?? []
    },
    enabled: isOpen,
  })

  const { data: buses = [] } = useQuery({
    queryKey: ['buses_bulk_modal'],
    queryFn: async () => {
      const { data } = await supabase.from('buses').select('id, name, total_seats').order('name')
      return data ?? []
    },
    enabled: isOpen,
  })

  const { data: hotels = [] } = useQuery({
    queryKey: ['hotels_bulk_modal'],
    queryFn: async () => {
      const { data } = await supabase.from('hotels').select('id, name, city').order('name')
      return data ?? []
    },
    enabled: isOpen,
  })

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedIds || selectedIds.length === 0) throw new Error('No departures selected')

      const updates: any = {}
      if (price.trim() !== '') updates.base_price = Number(price)
      if (totalSeats.trim() !== '') updates.total_seats = Number(totalSeats)
      if (tripCaptainId !== 'KEEP_CURRENT') updates.trip_captain_id = tripCaptainId === 'CLEAR' ? null : tripCaptainId
      if (busId !== 'KEEP_CURRENT') updates.bus_id = busId === 'CLEAR' ? null : busId
      if (hotelId !== 'KEEP_CURRENT') updates.hotel_id = hotelId === 'CLEAR' ? null : hotelId
      if (status !== 'KEEP_CURRENT') updates.status = status
      if (isVisible !== null) updates.is_visible = isVisible

      return bulkUpdateDepartures(selectedIds, updates)
    },
    onSuccess: (count) => {
      toast.success(`Successfully updated ${count} selected departures!`)
      onSuccess()
      onClose()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl bg-white rounded-3xl p-6 shadow-2xl">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-2xl bg-secondary/10 text-secondary border border-secondary/20">
              <Edit3 className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-display font-bold text-foreground">
                Bulk Edit Departures
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Updating <Badge className="bg-secondary text-white font-mono px-2 py-0.5">{selectedIds.length} Selected Rows</Badge>. Only non-empty fields will be updated.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded-xl border border-amber-200 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600" />
            <span>Targeting strictly selected IDs. All unselected departures remain untouched.</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Update Price (₹)
              </Label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Leave blank to keep current"
                className="rounded-xl h-11 font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Update Capacity
              </Label>
              <Input
                type="number"
                value={totalSeats}
                onChange={(e) => setTotalSeats(e.target.value)}
                placeholder="Leave blank to keep current"
                className="rounded-xl h-11 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Trip Captain
              </Label>
              <Select value={tripCaptainId} onValueChange={setTripCaptainId}>
                <SelectTrigger className="rounded-xl h-10 border-border text-xs">
                  <SelectValue placeholder="Keep current..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="KEEP_CURRENT">— Keep Current —</SelectItem>
                  <SelectItem value="CLEAR">None (Unassign)</SelectItem>
                  {captains.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Bus / Vehicle
              </Label>
              <Select value={busId} onValueChange={setBusId}>
                <SelectTrigger className="rounded-xl h-10 border-border text-xs">
                  <SelectValue placeholder="Keep current..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="KEEP_CURRENT">— Keep Current —</SelectItem>
                  <SelectItem value="CLEAR">None (Unassign)</SelectItem>
                  {buses.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Hotel / Stay
              </Label>
              <Select value={hotelId} onValueChange={setHotelId}>
                <SelectTrigger className="rounded-xl h-10 border-border text-xs">
                  <SelectValue placeholder="Keep current..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="KEEP_CURRENT">— Keep Current —</SelectItem>
                  <SelectItem value="CLEAR">None (Unassign)</SelectItem>
                  {hotels.map((h) => (
                    <SelectItem key={h.id} value={h.id}>
                      {h.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Status Update
              </Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="rounded-xl h-10 border-border text-xs">
                  <SelectValue placeholder="Keep current..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="KEEP_CURRENT">— Keep Current —</SelectItem>
                  <SelectItem value="UPCOMING">UPCOMING</SelectItem>
                  <SelectItem value="ONGOING">ONGOING</SelectItem>
                  <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                  <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                  <SelectItem value="SOLD_OUT">SOLD_OUT</SelectItem>
                  <SelectItem value="CLOSED">CLOSED</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Visibility
              </Label>
              <Select
                value={isVisible === null ? 'KEEP_CURRENT' : isVisible ? 'VISIBLE' : 'HIDDEN'}
                onValueChange={(val) => {
                  if (val === 'KEEP_CURRENT') setIsVisible(null)
                  else if (val === 'VISIBLE') setIsVisible(true)
                  else setIsVisible(false)
                }}
              >
                <SelectTrigger className="rounded-xl h-10 border-border text-xs">
                  <SelectValue placeholder="Keep current..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="KEEP_CURRENT">— Keep Current —</SelectItem>
                  <SelectItem value="VISIBLE">Make Visible (Public)</SelectItem>
                  <SelectItem value="HIDDEN">Make Hidden (Draft)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-4 border-t flex items-center justify-between">
          <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl">
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
            className="bg-secondary hover:bg-primary text-white font-bold rounded-xl px-6"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Updating...
              </>
            ) : (
              `Apply Bulk Edits to ${selectedIds.length} Rows`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
