import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { DataTable, exportToCSV } from '@/components/admin/DataTable'
import type { ColumnDef } from '@tanstack/react-table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  Users,
  Phone,
  Mail,
  Calendar,
  X,
  Check,
  Award,
  DollarSign,
  Loader2,
  Instagram,
  Linkedin,
  ExternalLink,
  FileSpreadsheet,
  Globe,
  Plus,
} from 'lucide-react'

export const Route = createFileRoute('/admin/community')({
  component: CommunityAdminPage,
})

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  ACCEPTED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
}

async function getApplications(params: {
  page: number
  pageSize: number
  search?: string
  status?: string
}) {
  const { page, pageSize, search, status } = params
  let query = supabase
    .from('explorer_applications')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  if (status) {
    query = query.eq('status', status)
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%,college.ilike.%${search}%,city.ilike.%${search}%`)
  }

  const { data, error, count } = await query
  if (error) throw new Error(error.message)
  return {
    data: data ?? [],
    total: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}

function CommunityAdminPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedApp, setSelectedApp] = useState<any | null>(null)
  const [internalNotes, setInternalNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)

  const { data: result, isLoading } = useQuery({
    queryKey: ['explorer_applications', page, pageSize, search, statusFilter],
    queryFn: () => getApplications({ page, pageSize, search, status: statusFilter || undefined }),
    placeholderData: (prev) => prev,
  })

  // Load Ambassadors list (Accepted applications with Ambassador role)
  const { data: ambassadors = [] } = useQuery({
    queryKey: ['community_ambassadors'],
    queryFn: async () => {
      const { data } = await supabase
        .from('explorer_applications')
        .select('*')
        .eq('status', 'ACCEPTED')
        .contains('roles', ['Ambassador'])
      return data ?? []
    }
  })

  // Load Creators list (Accepted applications with Creator role)
  const { data: creators = [] } = useQuery({
    queryKey: ['community_creators'],
    queryFn: async () => {
      const { data } = await supabase
        .from('explorer_applications')
        .select('*')
        .eq('status', 'ACCEPTED')
        .contains('roles', ['Creator'])
      return data ?? []
    }
  })

  // Load Trip Captains list (Accepted applications with Trip Captain role)
  const { data: captains = [] } = useQuery({
    queryKey: ['community_captains'],
    queryFn: async () => {
      const { data } = await supabase
        .from('explorer_applications')
        .select('*')
        .eq('status', 'ACCEPTED')
        .contains('roles', ['Trip Captain'])
      return data ?? []
    }
  })

  // Load referral stats log
  const { data: referrals = [] } = useQuery({
    queryKey: ['community_referrals'],
    queryFn: async () => {
      const { data } = await supabase
        .from('explorer_referrals')
        .select('*, customer:referrer_id(name), booking:referred_booking_id(booking_id, total_amount)')
        .order('created_at', { ascending: false })
      return data ?? []
    }
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ appId, status }: { appId: string; status: string }) => {
      const { error } = await supabase
        .from('explorer_applications')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', appId)
      if (error) throw error
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['explorer_applications'] })
      qc.invalidateQueries({ queryKey: ['community_ambassadors'] })
      qc.invalidateQueries({ queryKey: ['community_creators'] })
      qc.invalidateQueries({ queryKey: ['community_captains'] })
      toast.success(`Application status marked as ${variables.status}`)
      if (selectedApp && selectedApp.id === variables.appId) {
        setSelectedApp({ ...selectedApp, status: variables.status })
      }
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const saveNotes = async () => {
    if (!selectedApp) return
    setSavingNotes(true)
    try {
      const { error } = await supabase
        .from('explorer_applications')
        .update({ internal_notes: internalNotes, updated_at: new Date().toISOString() })
        .eq('id', selectedApp.id)
      
      if (error) throw error
      toast.success('Internal CRM notes updated')
      setSelectedApp({ ...selectedApp, internal_notes: internalNotes })
      qc.invalidateQueries({ queryKey: ['explorer_applications'] })
    } catch (e: any) {
      toast.error('Failed to save notes: ' + e.message)
    } finally {
      setSavingNotes(false)
    }
  }

  const handleExport = () => {
    const apps = result?.data ?? []
    exportToCSV(
      apps.map((a) => ({
        name: a.name,
        email: a.email,
        phone: a.phone,
        college: a.college ?? '',
        city: a.city,
        roles: a.roles.join(', '),
        instagram: a.instagram ?? '',
        linkedin: a.linkedin ?? '',
        status: a.status,
        created: a.created_at,
      })),
      'explorer_applications'
    )
  }

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'name',
      header: 'Applicant Details',
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-sm">{row.original.name}</p>
          <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
            <Phone className="h-3 w-3 shrink-0" />
            <span>{row.original.phone}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Mail className="h-3 w-3 shrink-0" />
            <span>{row.original.email}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'city',
      header: 'College & Location',
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium">{row.original.city}</p>
          {row.original.college && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">{row.original.college}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'roles',
      header: 'Selected Roles',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.roles.map((role: string) => (
            <Badge key={role} variant="secondary" className="text-[10px] px-1.5 font-semibold">
              {role}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge className={`${STATUS_BADGE[row.original.status] ?? 'bg-gray-100'} border-0 text-xs font-semibold`}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Applied Date',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground font-medium">
          {new Date(row.original.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      size: 80,
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedApp(row.original)
            setInternalNotes(row.original.internal_notes || '')
          }}
          className="text-xs font-semibold h-8 rounded-lg"
        >
          Inspect
        </Button>
      ),
    },
  ]

  const apps = result?.data ?? []

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold font-poppins text-foreground">Community CRM</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage explorer applications, ambassador programs, and UGC creators.
          </p>
        </div>
      </motion.div>

      <Tabs defaultValue="applications" className="w-full">
        <TabsList className="bg-muted/50 p-1 border rounded-xl h-11 mb-6 flex w-fit gap-1">
          <TabsTrigger value="applications" className="rounded-lg text-xs font-semibold px-4 font-poppins">Applications ({result?.total ?? 0})</TabsTrigger>
          <TabsTrigger value="ambassadors" className="rounded-lg text-xs font-semibold px-4 font-poppins">Ambassadors ({ambassadors.length})</TabsTrigger>
          <TabsTrigger value="creators" className="rounded-lg text-xs font-semibold px-4 font-poppins">Creators ({creators.length})</TabsTrigger>
          <TabsTrigger value="captains" className="rounded-lg text-xs font-semibold px-4 font-poppins">Trip Captains ({captains.length})</TabsTrigger>
          <TabsTrigger value="referrals" className="rounded-lg text-xs font-semibold px-4 font-poppins">Referrals ({referrals.length})</TabsTrigger>
        </TabsList>

        {/* APPLICATIONS TAB */}
        <TabsContent value="applications" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
          <DataTable
            data={apps}
            columns={columns}
            total={result?.total ?? 0}
            page={page}
            pageSize={pageSize}
            totalPages={result?.totalPages ?? 1}
            isLoading={isLoading}
            searchPlaceholder="Search candidates name, email, college..."
            onPageChange={setPage}
            onPageSizeChange={() => {}}
            onSearch={(s) => { setSearch(s); setPage(1) }}
            onSort={() => {}}
            onRefresh={() => qc.invalidateQueries({ queryKey: ['explorer_applications'] })}
            onExportCSV={handleExport}
            emptyMessage="No applications found."
          />
        </TabsContent>

        {/* AMBASSADORS TAB */}
        <TabsContent value="ambassadors" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
          <div className="bg-white border rounded-2xl p-6 shadow-soft">
            <h3 className="font-bold text-sm text-foreground mb-4">Active Campus Ambassadors</h3>
            {ambassadors.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">No active campus ambassadors registered.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ambassadors.map((amb: any) => (
                  <div key={amb.id} className="p-4 border rounded-xl bg-muted/5 flex items-start justify-between gap-3 text-xs">
                    <div>
                      <p className="font-semibold text-sm text-primary">{amb.name}</p>
                      <p className="text-muted-foreground mt-0.5">{amb.college || amb.city}</p>
                      <div className="flex gap-4 mt-2 text-muted-foreground font-medium">
                        <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {amb.phone}</span>
                        <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {amb.email}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* CREATORS TAB */}
        <TabsContent value="creators" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
          <div className="bg-white border rounded-2xl p-6 shadow-soft">
            <h3 className="font-bold text-sm text-foreground mb-4">Active UGC & Social Creators</h3>
            {creators.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">No active creators registered.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {creators.map((c: any) => (
                  <div key={c.id} className="p-4 border rounded-xl bg-muted/5 flex items-start justify-between gap-3 text-xs">
                    <div>
                      <p className="font-semibold text-sm text-primary">{c.name}</p>
                      <p className="text-muted-foreground mt-0.5">{c.city}</p>
                      <div className="flex gap-4 mt-2 text-muted-foreground font-medium">
                        {c.instagram && (
                          <a href={c.instagram.startsWith('http') ? c.instagram : `https://instagram.com/${c.instagram}`} target="_blank" rel="noreferrer" className="text-primary hover:underline font-semibold flex items-center gap-1">
                            <Instagram className="w-3.5 h-3.5" /> Instagram
                          </a>
                        )}
                        {c.youtube && (
                          <a href={c.youtube} target="_blank" rel="noreferrer" className="text-primary hover:underline font-semibold flex items-center gap-1">
                            <Globe className="w-3.5 h-3.5" /> YouTube
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* TRIP CAPTAINS TAB */}
        <TabsContent value="captains" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
          <div className="bg-white border rounded-2xl p-6 shadow-soft">
            <h3 className="font-bold text-sm text-foreground mb-4">Community Trip Captains</h3>
            {captains.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">No active captains from the explorer program yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {captains.map((cap: any) => (
                  <div key={cap.id} className="p-4 border rounded-xl bg-muted/5 flex items-start justify-between gap-3 text-xs">
                    <div>
                      <p className="font-semibold text-sm text-primary">{cap.name}</p>
                      <p className="text-muted-foreground mt-0.5">{cap.city} · {cap.skills || 'No skills listed'}</p>
                      <div className="flex gap-4 mt-2 text-muted-foreground font-medium">
                        <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {cap.phone}</span>
                        <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {cap.email}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* REFERRALS TAB */}
        <TabsContent value="referrals" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
          <div className="bg-white border rounded-2xl p-6 shadow-soft">
            <h3 className="font-bold text-sm text-foreground mb-4">Referrals & Commissions Logs</h3>
            {referrals.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">No referral transactions logged yet.</p>
            ) : (
              <div className="space-y-2">
                {referrals.map((ref: any) => (
                  <div key={ref.id} className="p-3 border rounded-xl flex items-center justify-between gap-3 text-xs bg-muted/5">
                    <div>
                      <p className="font-semibold text-primary">Referrer: {ref.customer?.name || 'Customer'}</p>
                      <p className="text-muted-foreground mt-0.5">Booking file: <span className="font-mono">{ref.booking?.booking_id || ref.referred_booking_id.slice(0, 8)}</span></p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Booking Amount: ₹{ref.booking?.total_amount?.toLocaleString('en-IN') || '—'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600">Reward: +{ref.reward_points} pts</p>
                      <p className="text-emerald-600 font-bold">Cashback: ₹{ref.cashback_amount}</p>
                      <Badge className="mt-1 text-[9px] font-bold border-0 bg-primary/10 text-primary">{ref.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Slide-out CRM Inspection Sheet Drawer */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setSelectedApp(null)} />

          <div className="relative w-full max-w-xl h-full bg-white shadow-2xl flex flex-col border-l animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/10">
              <div>
                <h3 className="font-bold font-poppins text-base text-primary">{selectedApp.name}</h3>
                <p className="text-[9px] text-muted-foreground font-bold uppercase mt-0.5">Explorer Application</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedApp(null)} className="h-8 w-8 rounded-lg">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              <div className="bg-muted/10 border p-4 rounded-xl space-y-2 text-muted-foreground leading-relaxed">
                <div className="flex justify-between border-b pb-1.5">
                  <span className="font-bold text-foreground">Phone Contact:</span>
                  <a href={`tel:${selectedApp.phone}`} className="text-primary hover:underline font-semibold flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" /> {selectedApp.phone}
                  </a>
                </div>
                <div className="flex justify-between border-b pb-1.5">
                  <span className="font-bold text-foreground">Email:</span>
                  <a href={`mailto:${selectedApp.email}`} className="text-primary hover:underline font-semibold flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" /> {selectedApp.email}
                  </a>
                </div>
                {selectedApp.college && (
                  <div className="flex justify-between border-b pb-1.5">
                    <span className="font-bold text-foreground">College:</span>
                    <span>{selectedApp.college}</span>
                  </div>
                )}
                <div className="flex justify-between border-b pb-1.5">
                  <span className="font-bold text-foreground">Location City:</span>
                  <span>{selectedApp.city}</span>
                </div>
                <div className="flex justify-between border-b pb-1.5">
                  <span className="font-bold text-foreground">Application Status:</span>
                  <Badge className={`${STATUS_BADGE[selectedApp.status] ?? 'bg-gray-100'} border-0 text-[10px] font-semibold h-5`}>
                    {selectedApp.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-foreground">Applied Date:</span>
                  <span>{new Date(selectedApp.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              {/* Roles selection list */}
              <div className="space-y-1.5">
                <p className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Desired Roles</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedApp.roles.map((r: string) => (
                    <Badge key={r} className="bg-primary/5 text-primary border border-primary/20 text-[10px] font-semibold py-0.5">
                      {r}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Social URLs handles list */}
              <div className="space-y-1.5">
                <p className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Social Credentials</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {selectedApp.instagram && (
                    <a
                      href={selectedApp.instagram.startsWith('http') ? selectedApp.instagram : `https://instagram.com/${selectedApp.instagram}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 border rounded-lg bg-white flex items-center justify-between text-muted-foreground hover:text-foreground hover:bg-muted/5 transition-colors"
                    >
                      <span className="flex items-center gap-1.5"><Instagram className="w-4 h-4 text-pink-600" /> Instagram</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {selectedApp.linkedin && (
                    <a
                      href={selectedApp.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 border rounded-lg bg-white flex items-center justify-between text-muted-foreground hover:text-foreground hover:bg-muted/5 transition-colors"
                    >
                      <span className="flex items-center gap-1.5"><Linkedin className="w-4 h-4 text-blue-700" /> LinkedIn</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {selectedApp.portfolio && (
                    <a
                      href={selectedApp.portfolio}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 border rounded-lg bg-white flex items-center justify-between text-muted-foreground hover:text-foreground hover:bg-muted/5 transition-colors font-semibold"
                    >
                      <span className="flex items-center gap-1.5"><Globe className="w-4 h-4 text-primary" /> Portfolio</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {selectedApp.youtube && (
                    <a
                      href={selectedApp.youtube}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 border rounded-lg bg-white flex items-center justify-between text-muted-foreground hover:text-foreground hover:bg-muted/5 transition-colors"
                    >
                      <span className="flex items-center gap-1.5"><Globe className="w-4 h-4 text-red-600" /> YouTube</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              {/* Questionnaire replies */}
              <div className="space-y-3 p-3 border rounded-xl bg-white">
                <div>
                  <p className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Why join Nomadik?</p>
                  <p className="mt-1 leading-relaxed text-foreground font-medium">{selectedApp.why_join}</p>
                </div>
                {selectedApp.experience && (
                  <div className="border-t pt-2 mt-2">
                    <p className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Leadership / Community Experience</p>
                    <p className="mt-1 leading-relaxed text-foreground font-medium">{selectedApp.experience}</p>
                  </div>
                )}
                {selectedApp.skills && (
                  <div className="border-t pt-2 mt-2">
                    <p className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Core Skills</p>
                    <p className="mt-1 leading-relaxed text-foreground font-medium">{selectedApp.skills}</p>
                  </div>
                )}
              </div>

              {/* CRM internal Notes */}
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Private CRM Review Notes</Label>
                <Textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="e.g. Spoken on call, verified Instagram UGC quality. Highly active."
                  rows={3}
                  className="text-xs rounded-xl"
                />
                <Button size="sm" onClick={saveNotes} disabled={savingNotes} className="rounded-lg h-9">
                  {savingNotes ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                  Save Notes
                </Button>
              </div>

              {/* Workflow Actions Accept / Reject */}
              <div className="border-t pt-4 flex gap-2">
                {selectedApp.status !== 'ACCEPTED' && (
                  <Button
                    onClick={() => updateStatusMutation.mutate({ appId: selectedApp.id, status: 'ACCEPTED' })}
                    disabled={updateStatusMutation.isPending}
                    className="flex-1 rounded-xl text-xs font-semibold h-10 gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Check className="w-4 h-4" /> Accept Applicant
                  </Button>
                )}
                {selectedApp.status !== 'REJECTED' && (
                  <Button
                    onClick={() => updateStatusMutation.mutate({ appId: selectedApp.id, status: 'REJECTED' })}
                    disabled={updateStatusMutation.isPending}
                    variant="destructive"
                    className="flex-1 rounded-xl text-xs font-semibold h-10 gap-1.5"
                  >
                    <X className="w-4 h-4" /> Reject Applicant
                  </Button>
                )}
                <a
                  href={`mailto:${selectedApp.email}?subject=Welcome to Nomadik Explorer Tribe!`}
                  className="rounded-xl border h-10 text-xs font-semibold flex items-center justify-center px-4 hover:bg-muted/10 transition-colors shrink-0"
                >
                  <Mail className="w-4 h-4 mr-1.5" /> Contact
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
