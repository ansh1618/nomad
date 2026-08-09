import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { DataTable, exportToCSV } from '@/components/admin/DataTable'
import { MediaPicker } from '@/components/admin/MediaPicker'
import type { ColumnDef } from '@tanstack/react-table'
import { getTripCaptains, createTripCaptain, updateTripCaptain, deleteTripCaptain, uploadMedia } from '@/lib/queries/admin'
import type { TripCaptain } from '@/types/supabase'
import { toast } from 'sonner'
import {
  ShieldCheck, Plus, Pencil, Trash2, Phone, Mail,
  Star, Download, Loader2, Image as ImageIcon, CheckCircle2
} from 'lucide-react'

export const Route = createFileRoute('/admin/trip-captains')({
  component: TripCaptainsAdminPage,
})

const EMPTY_FORM: Partial<TripCaptain> = {
  full_name: '',
  phone: '',
  email: '',
  photo_url: '',
  bio: '',
  rating: 4.9,
  total_trips: 0,
  experience_years: 1,
  specializations: '',
  languages: '',
  is_active: true,
  is_verified: true,
}

export function TripCaptainsAdminPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('full_name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  
  const [dialogOpen, setDialogOpen] = useState(false)
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<TripCaptain | null>(null)
  const [form, setForm] = useState<Partial<TripCaptain>>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const { data: result, isLoading } = useQuery({
    queryKey: ['trip_captains_admin', page, pageSize, search, sortBy, sortDir],
    queryFn: () => getTripCaptains({ page, pageSize, search, sortBy, sortDir }),
    placeholderData: (prev) => prev,
  })

  const captains = result?.data ?? []

  const openCreate = () => {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  const openEdit = (captain: TripCaptain) => {
    setEditTarget(captain)
    setForm({
      ...captain,
      specializations: Array.isArray(captain.specializations) ? captain.specializations.join(', ') : captain.specializations ?? '',
      languages: Array.isArray(captain.languages) ? captain.languages.join(', ') : captain.languages ?? '',
      is_verified: captain.is_verified ?? true,
    })
    setDialogOpen(true)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPhoto(true)
    try {
      const asset = await uploadMedia(file, 'captains')
      setForm((prev) => ({ ...prev, photo_url: asset.public_url }))
      toast.success('Captain photo uploaded successfully')
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload photo')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleSave = async () => {
    if (!form.full_name?.trim()) {
      toast.error('Full Name is required')
      return
    }
    setSaving(true)
    try {
      const payload: any = {
        full_name: form.full_name.trim(),
        phone: form.phone || '',
        email: form.email || null,
        photo_url: form.photo_url || null,
        bio: form.bio || null,
        rating: Number(form.rating) || 4.9,
        total_trips: Number(form.total_trips) || 0,
        experience_years: Number(form.experience_years) || 1,
        specializations: typeof form.specializations === 'string' ? form.specializations : null,
        languages: typeof form.languages === 'string' ? form.languages : null,
        is_active: Boolean(form.is_active),
        is_verified: Boolean(form.is_verified),
      }

      if (editTarget) {
        await updateTripCaptain(editTarget.id, payload)
        toast.success('Trip Captain updated')
      } else {
        await createTripCaptain(payload)
        toast.success('Trip Captain created')
      }
      qc.invalidateQueries({ queryKey: ['trip_captains_admin'] })
      qc.invalidateQueries({ queryKey: ['public_trip_captains'] })
      setDialogOpen(false)
    } catch (e: any) {
      toast.error(e.message || 'Failed to save captain profile')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this trip captain?')) return
    try {
      await deleteTripCaptain(id)
      qc.invalidateQueries({ queryKey: ['trip_captains_admin'] })
      qc.invalidateQueries({ queryKey: ['public_trip_captains'] })
      toast.success('Trip Captain removed')
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleExport = () => {
    exportToCSV(
      captains.map((c) => ({
        name: c.full_name,
        phone: c.phone,
        email: c.email ?? '',
        rating: c.rating,
        total_trips: c.total_trips,
        experience_years: c.experience_years,
        active: c.is_active ? 'Yes' : 'No',
        verified: c.is_verified ? 'Yes' : 'No',
      })),
      'trip_captains'
    )
  }

  const columns: ColumnDef<TripCaptain>[] = [
    {
      accessorKey: 'full_name',
      header: 'Trip Captain',
      cell: ({ row }) => {
        const c = row.original
        const initials = c.full_name
          ? c.full_name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)
          : 'TC'
        return (
          <div className="flex items-center gap-3">
            {c.photo_url ? (
              <img
                src={c.photo_url}
                alt={c.full_name}
                className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-sm shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#102A43] text-[#C8A96A] font-bold text-sm flex items-center justify-center border border-[#C8A96A]/30 shrink-0">
                {initials}
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <p className="font-bold text-sm text-[#102A43]">{c.full_name}</p>
                {c.is_verified !== false && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" title="Verified Captain" />
                )}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1">{c.bio || `${c.experience_years || 1}+ years with GoNomadik`}</p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'rating',
      header: 'Rating & Trips',
      cell: ({ row }) => {
        const c = row.original
        return (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-amber-600 font-bold text-xs">
              <Star className="h-3.5 w-3.5 fill-current" />
              <span>{c.rating ? c.rating.toFixed(1) : '4.9'} ★</span>
            </div>
            <p className="text-xs text-muted-foreground">{c.total_trips || 0} trips completed</p>
          </div>
        )
      },
    },
    {
      accessorKey: 'phone',
      header: 'Contact',
      cell: ({ row }) => {
        const c = row.original
        return (
          <div className="text-xs space-y-0.5">
            {c.phone && <p className="flex items-center gap-1 font-medium"><Phone className="h-3 w-3 text-muted-foreground" /> {c.phone}</p>}
            {c.email && <p className="flex items-center gap-1 text-muted-foreground"><Mail className="h-3 w-3" /> {c.email}</p>}
          </div>
        )
      },
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => {
        const c = row.original
        return (
          <div className="flex items-center gap-2">
            <Badge className={c.is_active ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100' : 'bg-slate-100 text-slate-700 hover:bg-slate-100'}>
              {c.is_active ? 'Active' : 'Inactive'}
            </Badge>
            {c.is_verified !== false && (
              <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-700 bg-emerald-50">
                Verified
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const c = row.original
        return (
          <div className="flex items-center justify-end gap-1">
            <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
              <Pencil className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl font-display font-bold text-[#102A43] flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-emerald-600" /> Trip Captains
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage real verified trip leaders shown on the public site & assigned to road departures.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport} className="gap-2 text-xs">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button onClick={openCreate} className="bg-[#102A43] text-white hover:bg-[#102A43]/90 gap-2 text-xs font-semibold">
            <Plus className="h-4 w-4" /> Add Trip Captain
          </Button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <DataTable
          columns={columns}
          data={captains}
          isLoading={isLoading}
          searchPlaceholder="Search captains by name or phone..."
          searchValue={search}
          onSearchChange={setSearch}
        />
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-lg text-[#102A43]">
              {editTarget ? 'Edit Trip Captain' : 'Add New Trip Captain'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-xs font-poppins pt-2">
            {/* Real Photo Upload / Preview */}
            <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <Label className="font-bold text-slate-800 block uppercase tracking-wider text-[11px]">Real Profile Photo</Label>
              <div className="flex items-center gap-4">
                {form.photo_url ? (
                  <img
                    src={form.photo_url}
                    alt="Captain photo"
                    className="w-16 h-16 rounded-full object-cover border-2 border-emerald-500/50 shadow-sm"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-[#102A43] text-[#C8A96A] font-bold text-lg flex items-center justify-center border border-[#C8A96A]/30">
                    {form.full_name ? form.full_name.slice(0, 2).toUpperCase() : 'TC'}
                  </div>
                )}

                <div className="space-y-2 flex-1">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Image URL (https://...)"
                      value={form.photo_url || ''}
                      onChange={(e) => setForm((prev) => ({ ...prev, photo_url: e.target.value }))}
                      className="h-9 text-xs"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setMediaPickerOpen(true)}
                      className="h-9 px-3 shrink-0 text-xs gap-1"
                    >
                      <ImageIcon className="h-3.5 w-3.5" /> Media Library
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id="captain-photo-input"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => document.getElementById('captain-photo-input')?.click()}
                      disabled={uploadingPhoto}
                      className="h-8 text-[11px] gap-1.5"
                    >
                      {uploadingPhoto ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
                      Upload File
                    </Button>
                    <span className="text-[10px] text-muted-foreground">Normal 1:1 portrait, natural lighting</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="font-semibold text-slate-700">Full Name *</Label>
                <Input
                  value={form.full_name || ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, full_name: e.target.value }))}
                  placeholder="e.g. Captain Rohit Kumar"
                />
              </div>

              <div className="space-y-1">
                <Label className="font-semibold text-slate-700">Phone Number *</Label>
                <Input
                  value={form.phone || ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="e.g. +91 98765 43210"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label className="font-semibold text-slate-700">Email Address (Optional)</Label>
                <Input
                  type="email"
                  value={form.email || ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="e.g. rohit@gonomadik.com"
                />
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-1">
              <Label className="font-semibold text-slate-700">Verified Bio / Short Description</Label>
              <Textarea
                value={form.bio || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
                placeholder="e.g. Certified mountaineer with 5+ years of experience leading Himalayan road convoys."
                rows={3}
              />
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="space-y-1">
                <Label className="font-semibold text-slate-700">Rating (★)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={form.rating ?? 4.9}
                  onChange={(e) => setForm((prev) => ({ ...prev, rating: parseFloat(e.target.value) }))}
                />
              </div>

              <div className="space-y-1">
                <Label className="font-semibold text-slate-700">Trips Completed</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.total_trips ?? 0}
                  onChange={(e) => setForm((prev) => ({ ...prev, total_trips: parseInt(e.target.value, 10) }))}
                />
              </div>

              <div className="space-y-1">
                <Label className="font-semibold text-slate-700">Years Experience</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.experience_years ?? 1}
                  onChange={(e) => setForm((prev) => ({ ...prev, experience_years: parseInt(e.target.value, 10) }))}
                />
              </div>
            </div>

            {/* Specialization */}
            <div className="space-y-1">
              <Label className="font-semibold text-slate-700">Specialization / Focus Areas</Label>
              <Input
                value={(form.specializations as string) || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, specializations: e.target.value }))}
                placeholder="e.g. Himalayan Expeditions, Rajasthan Road Convoys"
              />
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                <div>
                  <p className="font-bold text-slate-800">Active Profile</p>
                  <p className="text-[10px] text-muted-foreground">Visible on public site & assignments</p>
                </div>
                <Switch
                  checked={Boolean(form.is_active)}
                  onCheckedChange={(val) => setForm((prev) => ({ ...prev, is_active: val }))}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                <div>
                  <p className="font-bold text-slate-800">Verified Leader Badge</p>
                  <p className="text-[10px] text-muted-foreground">Displays ✓ Verified Captain badge</p>
                </div>
                <Switch
                  checked={Boolean(form.is_verified)}
                  onCheckedChange={(val) => setForm((prev) => ({ ...prev, is_verified: val }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-slate-200">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[#102A43] text-white hover:bg-[#102A43]/90 font-semibold gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editTarget ? 'Save Changes' : 'Create Captain'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Media Picker Modal */}
      <MediaPicker
        open={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={(asset) => {
          setForm((prev) => ({ ...prev, photo_url: asset.public_url }))
          setMediaPickerOpen(false)
          toast.success('Photo selected from media library')
        }}
        accept="image"
      />
    </div>
  )
}
