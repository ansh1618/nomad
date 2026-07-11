import { createFileRoute } from '@tanstack/react-router'
import { useState, useCallback, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import {
  Upload,
  Search,
  FolderOpen,
  Image as ImageIcon,
  Copy,
  Trash2,
  Loader2,
  Check,
} from 'lucide-react'
import { getMediaAssets, uploadMedia, deleteMediaAsset } from '@/lib/queries/admin'
import { useAdminAuth } from '@/hooks/use-admin-auth'
import type { MediaAsset } from '@/types/supabase'

export const Route = createFileRoute('/admin/media')({
  component: MediaLibraryPage,
})

function MediaLibraryPage() {
  const qc = useQueryClient()
  const { admin } = useAdminAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [search, setSearch] = useState('')
  const [folder, setFolder] = useState('/')
  const [page, setPage] = useState(1)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const { data: result, isLoading } = useQuery({
    queryKey: ['media_assets_library', search, folder, page],
    queryFn: () => getMediaAssets({ search, folder: folder === '/' ? undefined : folder, page, pageSize: 40 }),
  })

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!admin) throw new Error('Not authenticated')
      return uploadMedia(file, folder, admin.id)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['media_assets_library'] })
      toast.success('Media file uploaded successfully')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: ({ id, url }: { id: string; url: string }) => deleteMediaAsset(id, url),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['media_assets_library'] })
      toast.success('Asset deleted')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    for (const file of files) {
      await uploadMutation.mutateAsync(file)
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleCopy = (asset: MediaAsset) => {
    navigator.clipboard.writeText(asset.url)
    setCopiedId(asset.id)
    setTimeout(() => setCopiedId(null), 2000)
    toast.success('URL copied to clipboard')
  }

  const assets = result?.data ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold font-poppins">Media Library</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            WordPress-style asset manager. Upload images/assets, copy public URLs, and manage storage.
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={handleFileInput}
        />
        <Button onClick={() => fileInputRef.current?.click()} disabled={uploadMutation.isPending}>
          {uploadMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
          ) : (
            <Upload className="h-4 w-4 mr-1.5" />
          )}
          Upload Media
        </Button>
      </motion.div>

      {/* Main interface */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-5 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Folders</p>
              {['/', '/destinations', '/packages', '/blogs', '/misc'].map((f) => (
                <button
                  key={f}
                  onClick={() => { setFolder(f); setPage(1) }}
                  className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    folder === f ? 'bg-primary text-primary-foreground font-semibold' : 'hover:bg-muted text-foreground'
                  }`}
                >
                  <FolderOpen className="h-4 w-4" />
                  <span>{f === '/' ? 'All assets' : f.replace('/', '')}</span>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        <div className="lg:col-span-3 space-y-4">
          {/* Toolbar */}
          <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-border">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                placeholder="Search files..."
                className="pl-9"
              />
            </div>
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading assets...</p>
            </div>
          ) : assets.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground bg-white border border-border rounded-xl">
              No media assets found in this folder.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {assets.map((asset) => (
                <div key={asset.id} className="bg-white border rounded-xl overflow-hidden group relative h-40 shadow-soft">
                  {asset.mime_type.startsWith('image/') ? (
                    <img src={asset.url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}

                  {/* Actions overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col justify-between p-3 transition duration-300">
                    <p className="text-[11px] text-white font-medium truncate">{asset.filename}</p>
                    <div className="flex justify-end gap-1.5">
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => handleCopy(asset)}
                        className="h-7 w-7 rounded-md"
                        title="Copy URL"
                      >
                        {copiedId === asset.id ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => {
                          if (confirm('Delete this media file permanently?')) {
                            deleteMutation.mutate({ id: asset.id, url: asset.url })
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        className="h-7 w-7 rounded-md"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
