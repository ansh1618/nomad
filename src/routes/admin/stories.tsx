import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable, exportToCSV } from '@/components/admin/DataTable'
import type { ColumnDef } from '@tanstack/react-table'
import {
  getStories,
  deleteStory,
  publishStory,
  unpublishStory,
  featureStory,
  duplicateStory,
  getStoryStats,
} from '@/lib/queries/stories'
import type { Story } from '@/types/supabase'
import { toast } from 'sonner'
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  CheckCircle2,
  EyeOff,
  BookOpen,
  Loader2,
  Star,
  StarOff,
  Copy,
  TrendingUp,
  FileText,
  Globe,
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export const Route = createFileRoute('/admin/stories')({
  component: StoriesPage,
})

const STORY_CATEGORIES = ['ALL', 'Adventure', 'Weekend', 'Spiritual', 'Budget', 'College', 'Solo', 'Group', 'Family', 'International']

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: any; color: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground font-poppins">{label}</p>
        <p className="text-xl font-bold font-poppins">{typeof value === 'number' ? value.toLocaleString('en-IN') : value}</p>
      </div>
    </div>
  )
}

function StoriesPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [featuredFilter, setFeaturedFilter] = useState('ALL')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: result, isLoading } = useQuery({
    queryKey: ['stories_list', page, pageSize, search, sortBy, sortDir, statusFilter, categoryFilter, featuredFilter],
    queryFn: () =>
      getStories({
        page,
        pageSize,
        search,
        sortBy,
        sortDir,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        category: categoryFilter === 'ALL' ? undefined : categoryFilter,
        featured: featuredFilter === 'ALL' ? undefined : featuredFilter === 'FEATURED',
      }),
    placeholderData: (prev) => prev,
  })

  const { data: stats } = useQuery({
    queryKey: ['story_stats'],
    queryFn: getStoryStats,
  })

  const stories = result?.data ?? []

  const deleteMutation = useMutation({
    mutationFn: deleteStory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stories_list'] })
      qc.invalidateQueries({ queryKey: ['story_stats'] })
      toast.success('Story deleted')
      setDeleteId(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const publishMutation = useMutation({
    mutationFn: publishStory,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['stories_list'] }); qc.invalidateQueries({ queryKey: ['story_stats'] }); toast.success('Story published') },
    onError: (err: Error) => toast.error(err.message),
  })

  const unpublishMutation = useMutation({
    mutationFn: unpublishStory,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['stories_list'] }); qc.invalidateQueries({ queryKey: ['story_stats'] }); toast.success('Story unpublished') },
    onError: (err: Error) => toast.error(err.message),
  })

  const featureMutation = useMutation({
    mutationFn: ({ id, featured }: { id: string; featured: boolean }) => featureStory(id, featured),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['stories_list'] }); toast.success('Story updated') },
    onError: (err: Error) => toast.error(err.message),
  })

  const duplicateMutation = useMutation({
    mutationFn: duplicateStory,
    onSuccess: (newStory) => {
      qc.invalidateQueries({ queryKey: ['stories_list'] })
      qc.invalidateQueries({ queryKey: ['story_stats'] })
      toast.success(`Duplicated: ${newStory.title}`)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleSort = useCallback((by: string, dir: 'asc' | 'desc') => {
    setSortBy(by); setSortDir(dir)
  }, [])

  const handleExport = () => {
    exportToCSV(
      stories.map((s) => ({
        title: s.title,
        slug: s.slug,
        author: s.author_name ?? '',
        college: s.college_name ?? '',
        category: s.category,
        views: s.views,
        likes: s.likes_count,
        published: s.is_published,
        featured: s.is_featured,
        created_at: s.created_at,
      })),
      'stories'
    )
  }

  const columns: ColumnDef<Story>[] = [
    {
      accessorKey: 'title',
      header: 'Story',
      cell: ({ row }) => {
        const s = row.original
        return (
          <div className="flex items-center gap-3 max-w-sm">
            {s.cover_image ? (
              <img src={s.cover_image} alt={s.title} className="w-12 h-10 rounded-lg object-cover shrink-0" />
            ) : (
              <div className="w-12 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
            )}
            <div>
              <p className="font-semibold text-sm max-w-xs truncate">{s.title}</p>
              <p className="text-[10px] text-muted-foreground">
                {s.author_name || 'No Author'}{s.college_name ? ` · ${s.college_name}` : ''}
              </p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <Badge variant="outline" className="text-[10px] font-semibold capitalize">
          {row.original.category}
        </Badge>
      ),
    },
    {
      accessorKey: 'is_published',
      header: 'Status',
      cell: ({ row }) => {
        const s = row.original
        return (
          <div className="flex items-center gap-1.5">
            <Badge variant={s.is_published ? 'default' : 'secondary'}>
              {s.is_published ? 'Published' : 'Draft'}
            </Badge>
            {s.is_featured && (
              <Badge className="bg-amber-500/15 text-amber-700 border-amber-200 text-[10px]">
                <Star className="h-2.5 w-2.5 mr-1" />Featured
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'views',
      header: 'Views',
      cell: ({ row }) => (
        <span className="text-sm font-mono text-muted-foreground">{row.original.views.toLocaleString('en-IN')}</span>
      ),
    },
    {
      accessorKey: 'reading_time',
      header: 'Read Time',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{row.original.reading_time} min</span>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {new Date(row.original.created_at).toLocaleDateString('en-IN')}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      size: 60,
      cell: ({ row }) => {
        const s = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link to="/admin/stories/$id" params={{ id: s.id }}>
                  <Pencil className="h-3.5 w-3.5 mr-2" /> Edit Story
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => duplicateMutation.mutate(s.id)} disabled={duplicateMutation.isPending}>
                <Copy className="h-3.5 w-3.5 mr-2" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={`/stories/${s.slug}`} target="_blank" rel="noreferrer">
                  <Eye className="h-3.5 w-3.5 mr-2" /> Preview
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {s.is_published ? (
                <DropdownMenuItem onClick={() => unpublishMutation.mutate(s.id)}>
                  <EyeOff className="h-3.5 w-3.5 mr-2 text-muted-foreground" /> Unpublish
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => publishMutation.mutate(s.id)}>
                  <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-600" /> Publish
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => featureMutation.mutate({ id: s.id, featured: !s.is_featured })}>
                {s.is_featured ? (
                  <><StarOff className="h-3.5 w-3.5 mr-2" /> Remove Featured</>
                ) : (
                  <><Star className="h-3.5 w-3.5 mr-2 text-amber-500" /> Mark Featured</>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteId(s.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const filterComponent = (
    <div className="flex items-center gap-2">
      <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1) }}>
        <SelectTrigger className="w-36 h-9">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          {STORY_CATEGORIES.map((c) => (
            <SelectItem key={c} value={c}>{c === 'ALL' ? 'All Categories' : c}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
        <SelectTrigger className="w-32 h-9">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Status</SelectItem>
          <SelectItem value="PUBLISHED">Published</SelectItem>
          <SelectItem value="DRAFT">Draft</SelectItem>
        </SelectContent>
      </Select>
      <Select value={featuredFilter} onValueChange={(v) => { setFeaturedFilter(v); setPage(1) }}>
        <SelectTrigger className="w-32 h-9">
          <SelectValue placeholder="Featured" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All</SelectItem>
          <SelectItem value="FEATURED">Featured Only</SelectItem>
          <SelectItem value="NOT_FEATURED">Not Featured</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold font-poppins flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" /> Traveler Stories
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5 font-poppins">
            Manage customer travel experiences and testimonials
          </p>
        </div>
        <Link to="/admin/stories/$id" params={{ id: 'new' }}>
          <Button className="gap-1.5">
            <Plus className="h-4 w-4" /> Create Story
          </Button>
        </Link>
      </motion.div>

      {/* Stats */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-3"
        >
          <StatCard label="Total Stories" value={stats.total} icon={FileText} color="bg-primary/10 text-primary" />
          <StatCard label="Published" value={stats.published} icon={Globe} color="bg-emerald-500/10 text-emerald-600" />
          <StatCard label="Draft" value={stats.draft} icon={BookOpen} color="bg-amber-500/10 text-amber-600" />
          <StatCard label="Featured" value={stats.featured} icon={Star} color="bg-yellow-500/10 text-yellow-600" />
          <StatCard label="Total Views" value={stats.totalViews} icon={TrendingUp} color="bg-blue-500/10 text-blue-600" />
        </motion.div>
      )}

      {/* Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <DataTable
          data={stories}
          columns={columns as any}
          total={result?.total ?? 0}
          page={page}
          pageSize={pageSize}
          totalPages={result?.totalPages ?? 1}
          isLoading={isLoading}
          searchPlaceholder="Search stories, author, college..."
          onPageChange={setPage}
          onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
          onSearch={(s) => { setSearch(s); setPage(1) }}
          onSort={handleSort}
          onRefresh={() => qc.invalidateQueries({ queryKey: ['stories_list'] })}
          onExportCSV={handleExport}
          filterComponent={filterComponent}
          emptyMessage="No stories found. Create the first traveler story!"
        />
      </motion.div>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Story?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the story and all associated views and likes. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete Story
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
