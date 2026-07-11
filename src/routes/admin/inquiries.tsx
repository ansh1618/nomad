import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog'
import { getInquiries, createInquiry, updateInquiry } from '@/lib/queries/admin'
import { getPublishedDestinations } from '@/lib/queries/destinations'
import type { Inquiry } from '@/types/supabase'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Phone,
  MessageCircle,
  Plus,
  Loader2,
  Calendar,
  CheckCircle,
  TrendingRight,
  Info,
  Trash2,
  UserCheck,
  ClipboardList,
  Edit,
} from 'lucide-react'

export const Route = createFileRoute('/admin/inquiries')({
  component: InquiriesPage,
})

const STAGES = [
  { id: 'NEW', label: 'New Lead', color: 'border-blue-200 bg-blue-50 text-blue-800' },
  { id: 'CONTACTED', label: 'Contacted', color: 'border-amber-200 bg-amber-50 text-amber-800' },
  { id: 'INTERESTED', label: 'Interested', color: 'border-purple-200 bg-purple-50 text-purple-800' },
  { id: 'PAYMENT_PENDING', label: 'Payment Pending', color: 'border-orange-200 bg-orange-50 text-orange-800' },
  { id: 'CONVERTED', label: 'Converted', color: 'border-green-200 bg-green-50 text-green-800' },
]

type InquiryWithJoins = Inquiry & {
  destinations?: { name: string }
  journeys?: { name: string }
}

function InquiriesPage() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)

  // Form states for new lead
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [destId, setDestId] = useState('')
  const [message, setMessage] = useState('')

  // Edit states for support inquiries
  const [editingLead, setEditingLead] = useState<{
    type: 'contact' | 'consultation' | 'callback';
    data: any;
  } | null>(null)
  
  const [editStatus, setEditStatus] = useState('NEW')
  const [editNotes, setEditNotes] = useState('')
  const [editAssignedTo, setEditAssignedTo] = useState('')
  const [editFollowUpAt, setEditFollowUpAt] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  // Get admins list for assignment
  const { data: admins = [] } = useQuery({
    queryKey: ['admins_list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('admins').select('id, email, role, full_name')
      if (error) throw error
      return data || []
    }
  })

  // Queries for standard Convoy Leads
  const { data: result, isLoading } = useQuery({
    queryKey: ['inquiries_leads'],
    queryFn: () => getInquiries({ page: 1, pageSize: 200 }),
  })

  // Queries for other support tables
  const { data: contactsResult = [], isLoading: isLoadingContacts } = useQuery({
    queryKey: ['contact_inquiries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_inquiries')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    }
  })

  const { data: consultationsResult = [], isLoading: isLoadingConsultations } = useQuery({
    queryKey: ['consultation_requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consultation_requests')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    }
  })

  const { data: callbacksResult = [], isLoading: isLoadingCallbacks } = useQuery({
    queryKey: ['callback_requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('callback_requests')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    }
  })

  const { data: destinations = [] } = useQuery({
    queryKey: ['destinations_dropdown'],
    queryFn: getPublishedDestinations,
  })

  // Set up Supabase Realtime subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('admin_inquiries_realtime_all')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inquiries' },
        () => { qc.invalidateQueries({ queryKey: ['inquiries_leads'] }) }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contact_inquiries' },
        () => { qc.invalidateQueries({ queryKey: ['contact_inquiries'] }) }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'consultation_requests' },
        () => { qc.invalidateQueries({ queryKey: ['consultation_requests'] }) }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'callback_requests' },
        () => { qc.invalidateQueries({ queryKey: ['callback_requests'] }) }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [qc])

  const inquiries: InquiryWithJoins[] = (result?.data ?? []) as InquiryWithJoins[]

  const createMutation = useMutation({
    mutationFn: createInquiry,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inquiries_leads'] })
      toast.success('Lead inquiry added successfully')
      setOpen(false)
      setName('')
      setEmail('')
      setPhone('')
      setDestId('')
      setMessage('')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await updateInquiry(id, { status })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inquiries_leads'] })
      toast.success('Lead pipeline stage updated')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleCreateInquiry = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !phone) {
      toast.error('Name and Phone contact are required')
      return
    }

    createMutation.mutate({
      name,
      email: email || null,
      phone,
      destination_id: destId || null,
      message: message || null,
      status: 'NEW',
    })
  }

  const moveForward = (lead: InquiryWithJoins) => {
    const currentIdx = STAGES.findIndex((s) => s.id === lead.status)
    if (currentIdx !== -1 && currentIdx < STAGES.length - 1) {
      updateStatusMutation.mutate({ id: lead.id, status: STAGES[currentIdx + 1].id })
    }
  }

  const openEditModal = (type: 'contact' | 'consultation' | 'callback', lead: any) => {
    setEditingLead({ type, data: lead })
    setEditStatus(lead.status || 'NEW')
    setEditNotes(lead.admin_notes || lead.notes || '')
    setEditAssignedTo(lead.assigned_to || '')
    setEditFollowUpAt(lead.follow_up_at ? new Date(lead.follow_up_at).toISOString().split('T')[0] : '')
  }

  const handleSaveSupportEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingLead) return

    setSavingEdit(true)
    const tableName = 
      editingLead.type === 'contact' ? 'contact_inquiries' : 
      editingLead.type === 'consultation' ? 'consultation_requests' : 'callback_requests'
    
    const updatePayload: any = {
      status: editStatus,
      assigned_to: editAssignedTo || null,
      follow_up_at: editFollowUpAt ? new Date(editFollowUpAt).toISOString() : null,
      updated_at: new Date().toISOString()
    }

    if (editingLead.type === 'contact') {
      updatePayload.admin_notes = editNotes
    } else {
      updatePayload.notes = editNotes
    }

    const { error } = await supabase
      .from(tableName)
      .update(updatePayload)
      .eq('id', editingLead.data.id)

    setSavingEdit(false)
    if (error) {
      toast.error("Failed to update inquiry: " + error.message)
    } else {
      toast.success("Inquiry status updated successfully")
      setEditingLead(null)
      qc.invalidateQueries({ queryKey: [editingLead.type === 'contact' ? 'contact_inquiries' : editingLead.type === 'consultation' ? 'consultation_requests' : 'callback_requests'] })
    }
  }

  const getAdminName = (id: string) => {
    const admin = admins.find(a => a.id === id)
    return admin ? (admin.full_name || admin.email) : 'Unassigned'
  }

  return (
    <div className="space-y-6 font-sans text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-poppins">Leads & Inquiries CRM</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage convoy bookings, callback requests, student consultations, and contact forms.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1.5">
              <Plus className="h-4 w-4" /> Add Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-white rounded-2xl">
            <DialogHeader>
              <DialogTitle>Add Manual Lead Inquiry</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateInquiry} className="space-y-4 pt-3">
              <div className="space-y-1.5">
                <Label>Prospect Name *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Rahul Sharma" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Phone Contact *</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="e.g. +91 99999 88888" />
                </div>
                <div className="space-y-1.5">
                  <Label>Email Address</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. rahul@example.com" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Interested Destination</Label>
                <Select value={destId} onValueChange={setDestId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {destinations.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Enquiry Details / Message</Label>
                <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Trip details, budget, duration, seats..." rows={3} />
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                  Save Lead
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pipeline" className="space-y-4">
        <TabsList className="bg-muted p-1 rounded-xl">
          <TabsTrigger value="pipeline" className="rounded-lg">Convoy Leads</TabsTrigger>
          <TabsTrigger value="contact" className="rounded-lg">Contact Forms</TabsTrigger>
          <TabsTrigger value="consultation" className="rounded-lg">Consultations</TabsTrigger>
          <TabsTrigger value="callback" className="rounded-lg">Callback Requests</TabsTrigger>
        </TabsList>

        {/* Tab 1: Pipeline Kanban Board */}
        <TabsContent value="pipeline" className="outline-none pt-2">
          {isLoading ? (
            <div className="py-24 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-6">
              {STAGES.map((stage) => {
                const stageLeads = inquiries.filter((l) => l.status === stage.id)
                return (
                  <div
                    key={stage.id}
                    className="bg-muted/30 p-3 rounded-2xl border flex flex-col min-w-[260px] max-h-[75vh]"
                  >
                    <div className="flex justify-between items-center mb-3 px-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{stage.label}</span>
                      <Badge variant="secondary" className="text-[10px] font-bold">{stageLeads.length}</Badge>
                    </div>

                    <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                      {stageLeads.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic text-center py-8 bg-card/50 rounded-xl border border-dashed">
                          No leads
                        </p>
                      ) : (
                        stageLeads.map((lead) => (
                          <motion.div
                            key={lead.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="bg-card border rounded-xl p-3.5 space-y-3 shadow-soft hover:shadow-md transition-shadow relative group"
                          >
                            <div>
                              <p className="font-semibold text-sm">{lead.name}</p>
                              <p className="text-xs text-muted-foreground font-mono mt-0.5">{lead.phone}</p>
                            </div>

                            <div className="text-xs space-y-1 border-t pt-2 text-muted-foreground">
                              <p>
                                Trip:{' '}
                                <span className="text-foreground font-medium">
                                  {lead.journeys?.name ?? lead.destinations?.name ?? 'General Inquiry'}
                                </span>
                              </p>
                              <p className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(lead.created_at).toLocaleDateString('en-IN')}
                              </p>
                            </div>

                            {lead.message && (
                              <div className="text-xs bg-muted/40 p-2 rounded-lg italic text-muted-foreground line-clamp-3">
                                "{lead.message}"
                              </div>
                            )}

                            <div className="flex gap-1.5 justify-end border-t pt-2">
                              <a href={`tel:${lead.phone}`} title="Call Customer">
                                <Button size="icon" variant="outline" className="h-7 w-7 rounded-md">
                                  <Phone className="h-3.5 w-3.5" />
                                </Button>
                              </a>
                              <a
                                href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                title="WhatsApp"
                              >
                                <Button size="icon" variant="outline" className="h-7 w-7 rounded-md text-emerald-600">
                                  <MessageCircle className="h-3.5 w-3.5" />
                                </Button>
                              </a>

                              {stage.id !== 'CONVERTED' && (
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-7 w-7 rounded-md text-primary"
                                  onClick={() => moveForward(lead)}
                                  title="Move forward"
                                >
                                  <CheckCircle className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Contact Messages */}
        <TabsContent value="contact" className="outline-none pt-2">
          {isLoadingContacts ? (
            <div className="py-24 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contactsResult.length === 0 ? (
                <p className="text-sm text-muted-foreground italic col-span-3 py-12 text-center border border-dashed rounded-3xl bg-muted/10">No contact messages received.</p>
              ) : (
                contactsResult.map((c: any) => (
                  <Card key={c.id} className="shadow-soft hover:shadow-md transition">
                    <CardContent className="p-5 space-y-3.5">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-sm text-primary">{c.name}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">{c.email}</p>
                          <p className="text-xs text-muted-foreground font-mono">{c.phone}</p>
                        </div>
                        <Badge 
                          variant={c.status === 'RESOLVED' ? 'default' : c.status === 'NEW' ? 'secondary' : 'outline'}
                          className="text-[9px]"
                        >
                          {c.status}
                        </Badge>
                      </div>
                      <div className="text-xs bg-muted/40 p-2.5 rounded-lg border border-border">
                        <p className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wide">Route/Subject:</p>
                        <p className="font-medium text-foreground mt-0.5">{c.subject}</p>
                        <p className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wide mt-2">Message:</p>
                        <p className="text-muted-foreground italic mt-0.5">"{c.message}"</p>
                      </div>
                      <div className="text-[10px] text-muted-foreground space-y-1 pt-1.5 border-t border-border">
                        <p><strong>Assigned To:</strong> {getAdminName(c.assigned_to)}</p>
                        {c.follow_up_at && (
                          <p className="text-accent font-semibold">
                            <strong>Follow Up:</strong> {new Date(c.follow_up_at).toLocaleDateString('en-IN')}
                          </p>
                        )}
                        {c.admin_notes && <p><strong>Notes:</strong> {c.admin_notes}</p>}
                      </div>
                      <div className="flex gap-2 justify-end border-t border-border pt-3">
                        <a href={`tel:${c.phone}`} title="Call">
                          <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5">
                            <Phone className="h-3.5 w-3.5" /> Call
                          </Button>
                        </a>
                        <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => openEditModal('contact', c)}>
                          <Edit className="h-3.5 w-3.5" /> Manage
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </TabsContent>

        {/* Tab 3: Consultation Requests */}
        <TabsContent value="consultation" className="outline-none pt-2">
          {isLoadingConsultations ? (
            <div className="py-24 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {consultationsResult.length === 0 ? (
                <p className="text-sm text-muted-foreground italic col-span-3 py-12 text-center border border-dashed rounded-3xl bg-muted/10">No consultation requests registered.</p>
              ) : (
                consultationsResult.map((c: any) => (
                  <Card key={c.id} className="shadow-soft hover:shadow-md transition">
                    <CardContent className="p-5 space-y-3.5">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-sm text-primary">{c.name}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">{c.email}</p>
                          <p className="text-xs text-muted-foreground font-mono">{c.phone}</p>
                        </div>
                        <Badge 
                          variant={c.status === 'RESOLVED' ? 'default' : c.status === 'NEW' ? 'secondary' : 'outline'}
                          className="text-[9px]"
                        >
                          {c.status}
                        </Badge>
                      </div>
                      <div className="text-xs bg-muted/40 p-2.5 rounded-lg border border-border space-y-2">
                        <div>
                          <p className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wide">Destination & Budget:</p>
                          <p className="font-medium text-foreground mt-0.5">
                            {c.destination || "Any Destination"} • {c.budget || "No budget set"}
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wide">Preferred Time slot:</p>
                          <p className="font-medium text-foreground mt-0.5">
                            {c.preferred_date ? new Date(c.preferred_date).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : "No date"} at {c.preferred_time || "Any time"}
                          </p>
                        </div>
                        {c.notes && (
                          <div>
                            <p className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wide">Notes:</p>
                            <p className="text-muted-foreground italic mt-0.5">"{c.notes}"</p>
                          </div>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground space-y-1 pt-1.5 border-t border-border">
                        <p><strong>Assigned To:</strong> {getAdminName(c.assigned_to)}</p>
                        {c.follow_up_at && (
                          <p className="text-accent font-semibold">
                            <strong>Follow Up:</strong> {new Date(c.follow_up_at).toLocaleDateString('en-IN')}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 justify-end border-t border-border pt-3">
                        <a href={`tel:${c.phone}`} title="Call">
                          <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5">
                            <Phone className="h-3.5 w-3.5" /> Call
                          </Button>
                        </a>
                        <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => openEditModal('consultation', c)}>
                          <Edit className="h-3.5 w-3.5" /> Manage
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </TabsContent>

        {/* Tab 4: Callback Requests */}
        <TabsContent value="callback" className="outline-none pt-2">
          {isLoadingCallbacks ? (
            <div className="py-24 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {callbacksResult.length === 0 ? (
                <p className="text-sm text-muted-foreground italic col-span-3 py-12 text-center border border-dashed rounded-3xl bg-muted/10">No callback requests pending.</p>
              ) : (
                callbacksResult.map((c: any) => (
                  <Card key={c.id} className="shadow-soft hover:shadow-md transition">
                    <CardContent className="p-5 space-y-3.5">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-sm text-primary">{c.name}</h4>
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">{c.phone}</p>
                        </div>
                        <Badge 
                           variant={c.status === 'RESOLVED' ? 'default' : c.status === 'NEW' ? 'secondary' : 'outline'}
                          className="text-[9px]"
                        >
                          {c.status}
                        </Badge>
                      </div>
                      <div className="text-xs bg-muted/40 p-2.5 rounded-lg border border-border space-y-1.5">
                        <div>
                          <p className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wide">Preferred Time slot:</p>
                          <p className="font-medium text-foreground mt-0.5">{c.preferred_time || "Immediate call requested"}</p>
                        </div>
                        {c.notes && (
                          <div>
                            <p className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wide">Callback Details:</p>
                            <p className="text-muted-foreground italic mt-0.5">"{c.notes}"</p>
                          </div>
                        )}
                      </div>

                      <div className="text-[10px] text-muted-foreground space-y-1 pt-1.5 border-t border-border">
                        <p><strong>Assigned To:</strong> {getAdminName(c.assigned_to)}</p>
                        {c.follow_up_at && (
                          <p className="text-accent font-semibold">
                            <strong>Follow Up:</strong> {new Date(c.follow_up_at).toLocaleDateString('en-IN')}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 justify-end border-t border-border pt-3">
                        <a href={`tel:${c.phone}`} title="Call">
                          <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5">
                            <Phone className="h-3.5 w-3.5" /> Call
                          </Button>
                        </a>
                        <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => openEditModal('callback', c)}>
                          <Edit className="h-3.5 w-3.5" /> Manage
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit/Manage Modal for Support Requests */}
      <Dialog open={!!editingLead} onOpenChange={(open) => !open && setEditingLead(null)}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold text-primary">Manage support request</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update inquiry status, add internal notes, assign tasks, and schedule follow-ups.
            </DialogDescription>
          </DialogHeader>
          {editingLead && (
            <form onSubmit={handleSaveSupportEdit} className="space-y-4 pt-3">
              <div className="bg-muted/40 p-3 rounded-lg text-xs space-y-1 border">
                <p><strong>Lead Name:</strong> {editingLead.data.name}</p>
                <p><strong>Phone:</strong> {editingLead.data.phone}</p>
                {editingLead.data.email && <p><strong>Email:</strong> {editingLead.data.email}</p>}
                {editingLead.type === 'consultation' && <p><strong>Preferred Date:</strong> {editingLead.data.preferred_date || 'None'}</p>}
                {editingLead.type === 'contact' && <p><strong>Subject/Route:</strong> {editingLead.data.subject}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Inquiry Status</Label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEW">New Request</SelectItem>
                    <SelectItem value="CONTACTED">Contacted</SelectItem>
                    <SelectItem value="RESOLVED">Resolved / Handled</SelectItem>
                    <SelectItem value="SPAM">Mark as Spam</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Assign Lead To</Label>
                <Select value={editAssignedTo} onValueChange={setEditAssignedTo}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {admins.map((a: any) => (
                      <SelectItem key={a.id} value={a.id}>{a.full_name || a.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Schedule Follow-Up Date</Label>
                <Input 
                  type="date" 
                  value={editFollowUpAt} 
                  onChange={(e) => setEditFollowUpAt(e.target.value)} 
                  className="bg-white text-xs" 
                />
              </div>

              <div className="space-y-1.5">
                <Label>Internal Admin Notes</Label>
                <Textarea 
                  value={editNotes} 
                  onChange={(e) => setEditNotes(e.target.value)} 
                  placeholder="Record customer replies, requirements, next action items..." 
                  className="bg-white text-xs min-h-20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setEditingLead(null)}>Cancel</Button>
                <Button type="submit" disabled={savingEdit}>
                  {savingEdit ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                  Save Changes
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
