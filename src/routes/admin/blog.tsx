import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable, exportToCSV } from '@/components/admin/DataTable'
import type { ColumnDef } from '@tanstack/react-table'
import { getBlogs, deleteBlog } from '@/lib/queries/admin'
import type { Blog } from '@/types/supabase'
import { toast } from 'sonner'
import {
  Plus,
  Pencil,
  Trash2,
  Calendar,
  Loader2,
  FileText,
  Eye,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export const Route = createFileRoute('/admin/blog')({
  component: BlogPage,
})

function BlogPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [publishedFilter, setPublishedFilter] = useState('ALL')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: result, isLoading } = useQuery({
    queryKey: ['blogs_list', page, pageSize, search, sortBy, sortDir, publishedFilter],
    queryFn: () =>
      getBlogs({
        page,
        pageSize,
        search,
        sortBy,
        sortDir,
        published: publishedFilter === 'PUBLISHED' ? true : publishedFilter === 'DRAFT' ? false : undefined,
      }),
    placeholderData: (prev) => prev,
  })

  const blogs = result?.data ?? []

  const deleteMutation = useMutation({
    mutationFn: deleteBlog,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blogs_list'] })
      toast.success('Blog post deleted successfully')
      setDeleteId(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleSort = useCallback((by: string, dir: 'asc' | 'desc') => {
    setSortBy(by)
    setSortDir(dir)
  }, [])

  const handleExport = () => {
    exportToCSV(
      blogs.map((b) => ({
        title: b.title,
        slug: b.slug,
        excerpt: b.excerpt ?? '',
        published: b.is_published,
        view_count: b.view_count,
        created_at: b.created_at,
      })),
      'blogs'
    )
  }

  const columns: ColumnDef<Blog>[] = [
    {
      accessorKey: 'title',
      header: 'Title / Excerpt',
      cell: ({ row }) => {
        const b = row.original
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm max-w-sm truncate">{b.title}</p>
              <p className="text-xs text-muted-foreground max-w-sm truncate">{b.excerpt || 'No description preview'}</p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'is_published',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.is_published ? 'default' : 'secondary'}>
          {row.original.is_published ? 'Published' : 'Draft'}
        </Badge>
      ),
    },
    {
      accessorKey: 'view_count',
      header: 'Views',
      cell: ({ row }) => <span className="text-sm font-mono">{row.original.view_count || 0} views</span>,
    },
    {
      accessorKey: 'created_at',
      header: 'Created At',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {new Date(row.original.created_at).toLocaleDateString('en-IN')}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      size: 100,
      cell: ({ row }) => {
        const b = row.original
        return (
          <div className="flex items-center gap-1.5 justify-end">
            <Link to="/admin/blog/$id" params={{ id: b.id }}>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-primary">
                <Pencil className="h-4 w-4" />
              </Button>
            </Link>
            <a href={`/blog/${b.slug}`} target="_blank" rel="noreferrer">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                <Eye className="h-4 w-4" />
              </Button>
            </a>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteId(b.id)}
              className="h-8 w-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ]

  const filters = (
    <Select value={publishedFilter} onValueChange={(v) => { setPublishedFilter(v); setPage(1) }}>
      <SelectTrigger className="w-36 h-9">
        <SelectValue placeholder="All Status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">All Status</SelectItem>
        <SelectItem value="PUBLISHED">Published</SelectItem>
        <SelectItem value="DRAFT">Draft</SelectItem>
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
          <h1 className="text-2xl font-bold font-poppins">Blog Posts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {result?.total ?? 0} article{(result?.total ?? 0) !== 1 ? 's' : ''} total
          </p>
        </div>
        <Link to="/admin/blog/new">
          <Button className="gap-1.5">
            <Plus className="h-4 w-4" /> Add Blog Post
          </Button>
        </Link>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <DataTable
          data={blogs}
          columns={columns}
          total={result?.total ?? 0}
          page={page}
          pageSize={pageSize}
          totalPages={result?.totalPages ?? 1}
          isLoading={isLoading}
          searchPlaceholder="Search title..."
          onPageChange={setPage}
          onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
          onSearch={(s) => { setSearch(s); setPage(1) }}
          onSort={handleSort}
          onRefresh={() => qc.invalidateQueries({ queryKey: ['blogs_list'] })}
          onExportCSV={handleExport}
          filterComponent={filters}
          emptyMessage="No articles found."
        />
      </motion.div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Blog Post?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this blog post? This action cannot be undone.
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
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
