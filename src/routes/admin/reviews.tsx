import { createFileRoute } from '@tanstack/react-router'
import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'motion/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { DataTable } from '@/components/admin/DataTable'
import type { ColumnDef } from '@tanstack/react-table'
import {
  getReviews,
  approveReview,
  replyToReview,
  deleteReview,
} from '@/lib/queries/admin'
import type { Review } from '@/types/supabase'
import { toast } from 'sonner'
import {
  Star,
  Check,
  X,
  MessageSquare,
  Trash2,
  Loader2,
  Calendar,
  Eye,
  CheckCircle2,
} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export const Route = createFileRoute('/admin/reviews')({
  component: ReviewsPage,
})

type ReviewWithJoins = Review & {
  journeys?: { name: string }
}

function ReviewsPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [approvedFilter, setApprovedFilter] = useState('ALL')

  const [activeReplyId, setActiveReplyId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')

  const { data: result, isLoading } = useQuery({
    queryKey: ['reviews_list', page, pageSize, search, sortBy, sortDir, approvedFilter],
    queryFn: () =>
      getReviews({
        page,
        pageSize,
        search,
        sortBy,
        sortDir,
        approved: approvedFilter === 'APPROVED' ? true : approvedFilter === 'PENDING' ? false : undefined,
      }),
    placeholderData: (prev) => prev,
  })

  const reviews = (result?.data ?? []) as ReviewWithJoins[]

  const approveMutation = useMutation({
    mutationFn: async ({ id, approve }: { id: string; approve: boolean }) => {
      const { supabase } = await import('@/lib/supabase')
      const { error } = await supabase.from('reviews').update({ is_approved: approve, updated_at: new Date().toISOString() }).eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['reviews_list'] })
      toast.success(variables.approve ? 'Review approved' : 'Review unapproved')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const replyMutation = useMutation({
    mutationFn: ({ id, reply }: { id: string; reply: string }) => replyToReview(id, reply),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews_list'] })
      toast.success('Official response saved')
      setActiveReplyId(null)
      setReplyText('')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteReview,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews_list'] })
      toast.success('Review deleted')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleSort = useCallback((by: string, dir: 'asc' | 'desc') => {
    setSortBy(by)
    setSortDir(dir)
  }, [])

  const columns: ColumnDef<ReviewWithJoins>[] = [
    {
      accessorKey: 'author_name',
      header: 'Author',
      cell: ({ row }) => {
        const r = row.original
        return (
          <div>
            <p className="font-semibold text-sm">{r.author_name}</p>
            <p className="text-xs text-muted-foreground">Trip date: {r.trip_date ?? '—'}</p>
          </div>
        )
      },
    },
    {
      accessorKey: 'journeys.name',
      header: 'Package',
      cell: ({ row }) => <span className="text-sm font-medium">{row.original.journeys?.name ?? '—'}</span>,
    },
    {
      accessorKey: 'rating',
      header: 'Rating',
      cell: ({ row }) => (
        <span className="flex items-center gap-0.5 text-amber-500 font-semibold text-sm">
          <Star className="h-3.5 w-3.5 fill-current" />
          {row.original.rating}
        </span>
      ),
    },
    {
      accessorKey: 'content',
      header: 'Review Text',
      cell: ({ row }) => {
        const r = row.original
        return (
          <div className="max-w-md space-y-1">
            {r.title && <p className="font-semibold text-sm">{r.title}</p>}
            <p className="text-sm text-muted-foreground italic leading-relaxed">"{r.content}"</p>
            {r.admin_reply && (
              <div className="bg-primary/5 p-2 rounded-lg border-l-2 border-primary text-xs mt-2">
                <span className="font-bold text-primary block mb-0.5">Reply:</span>
                <p className="text-muted-foreground">{r.admin_reply}</p>
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'is_approved',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.is_approved ? 'default' : 'secondary'}>
          {row.original.is_approved ? 'Approved' : 'Pending'}
        </Badge>
      ),
    },
    {
      accessorKey: 'is_featured',
      header: 'Featured',
      cell: ({ row }) => (
        <Switch
          checked={row.original.is_featured}
          onCheckedChange={async (checked) => {
            const { supabase } = await import('@/lib/supabase')
            await supabase.from('reviews').update({ is_featured: checked }).eq('id', row.original.id)
            qc.invalidateQueries({ queryKey: ['reviews_list'] })
            toast.success(`Review ${checked ? 'featured' : 'unfeatured'}`)
          }}
        />
      ),
    },
    {
      id: 'actions',
      header: '',
      size: 140,
      cell: ({ row }) => {
        const r = row.original
        return (
          <div className="flex items-center gap-1.5 justify-end">
            {!r.is_approved ? (
              <Button
                size="sm"
                className="h-8 bg-green-600 hover:bg-green-700"
                onClick={() => approveMutation.mutate({ id: r.id, approve: true })}
              >
                <Check className="h-3.5 w-3.5 mr-1" /> Approve
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-destructive hover:text-destructive hover:bg-destructive/5"
                onClick={() => approveMutation.mutate({ id: r.id, approve: false })}
              >
                <X className="h-3.5 w-3.5 mr-1" /> Hide
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              className="h-8"
              onClick={() => {
                setActiveReplyId(r.id)
                setReplyText(r.admin_reply ?? '')
              }}
            >
              <MessageSquare className="h-3.5 w-3.5 mr-1" /> Reply
            </Button>

            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-destructive hover:text-destructive"
              onClick={() => {
                if (confirm('Delete this review permanently?')) {
                  deleteMutation.mutate(r.id)
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ]

  const filters = (
    <Select value={approvedFilter} onValueChange={(v) => { setApprovedFilter(v); setPage(1) }}>
      <SelectTrigger className="w-40 h-9">
        <SelectValue placeholder="Moderation Queue" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">All Reviews</SelectItem>
        <SelectItem value="APPROVED">Approved</SelectItem>
        <SelectItem value="PENDING">Pending Approval</SelectItem>
      </SelectContent>
    </Select>
  )

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold font-poppins">Reviews Moderation</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Approve testimonials, feature reviews, and post official replies.
          </p>
        </div>
      </motion.div>

      {/* Reply dialog */}
      <Dialog open={!!activeReplyId} onOpenChange={() => setActiveReplyId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Post Official Reply</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-3">
            <Label>Admin Response</Label>
            <Textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Thank you for sharing your feedback with us..."
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setActiveReplyId(null)}>Cancel</Button>
              <Button
                onClick={() => activeReplyId && replyMutation.mutate({ id: activeReplyId, reply: replyText })}
                disabled={replyMutation.isPending}
              >
                {replyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                Save Reply
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <DataTable
          data={reviews}
          columns={columns}
          total={result?.total ?? 0}
          page={page}
          pageSize={pageSize}
          totalPages={result?.totalPages ?? 1}
          isLoading={isLoading}
          searchPlaceholder="Search reviewer name..."
          onPageChange={setPage}
          onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
          onSearch={(s) => { setSearch(s); setPage(1) }}
          onSort={handleSort}
          onRefresh={() => qc.invalidateQueries({ queryKey: ['reviews_list'] })}
          filterComponent={filters}
          emptyMessage="No reviews found in queue."
        />
      </motion.div>
    </div>
  )
}
