'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMediaAssets, uploadMedia, deleteMediaAsset } from '@/lib/queries/admin'
import { useAdminAuth } from '@/hooks/use-admin-auth'
import {
  Search,
  Upload,
  Loader2,
  Trash2,
  Copy,
  Check,
  Image as ImageIcon,
  Grid2X2,
  LayoutList,
  FolderOpen,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import type { MediaAsset } from '@/types/supabase'

interface MediaPickerProps {
  open: boolean
  onClose: () => void
  onSelect: (asset: MediaAsset) => void
  accept?: string // 'image', 'video', '*'
  multiple?: boolean
}

export function MediaPicker({ open, onClose, onSelect, accept = 'image', multiple = false }: MediaPickerProps) {
  const { admin } = useAdminAuth()
  const qc = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [search, setSearch] = useState('')
  const [folder, setFolder] = useState('/')
  const [page, setPage] = useState(1)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [selected, setSelected] = useState<MediaAsset | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const mimeFilter = accept === 'image' ? 'image' : accept === 'video' ? 'video' : undefined

  const { data: result, isLoading } = useQuery({
    queryKey: ['media_assets', search, folder, page, mimeFilter],
    queryFn: () => getMediaAssets({ search, folder: folder === '/' ? undefined : folder, mimeType: mimeFilter, page, pageSize: 40 }),
    enabled: open,
  })

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!admin) throw new Error('Not authenticated')
      return uploadMedia(file, folder, admin.id)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['media_assets'] })
      toast.success('File uploaded successfully')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: ({ id, url }: { id: string; url: string }) => deleteMediaAsset(id, url),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['media_assets'] })
      if (selected?.id === deleteMutation.variables?.id) setSelected(null)
      toast.success('File deleted')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleFileDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      const files = Array.from(e.dataTransfer.files)
      for (const file of files) {
        await uploadMutation.mutateAsync(file)
      }
    },
    [uploadMutation]
  )

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? [])
      for (const file of files) {
        await uploadMutation.mutateAsync(file)
      }
      if (fileInputRef.current) fileInputRef.current.value = ''
    },
    [uploadMutation]
  )

  const handleCopyUrl = (asset: MediaAsset) => {
    navigator.clipboard.writeText(asset.url)
    setCopiedId(asset.id)
    setTimeout(() => setCopiedId(null), 2000)
    toast.success('URL copied to clipboard')
  }

  const handleSelect = (asset: MediaAsset) => {
    if (multiple) {
      onSelect(asset)
    } else {
      setSelected(asset)
    }
  }

  const handleConfirm = () => {
    if (selected) {
      onSelect(selected)
      onClose()
    }
  }

  const assets = result?.data ?? []

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            Media Library
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-full overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center gap-3 px-4 py-3 border-b bg-muted/20">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                placeholder="Search files..."
                className="pl-9 h-8"
              />
            </div>

            <div className="flex items-center gap-1 border rounded-md p-0.5">
              <button
                className={`p-1.5 rounded ${view === 'grid' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
                onClick={() => setView('grid')}
              >
                <Grid2X2 className="h-4 w-4" />
              </button>
              <button
                className={`p-1.5 rounded ${view === 'list' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
                onClick={() => setView('list')}
              >
                <LayoutList className="h-4 w-4" />
              </button>
            </div>

            {/* Upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept={accept === 'image' ? 'image/*' : accept === 'video' ? 'video/*' : '*'}
              multiple
              className="hidden"
              onChange={handleFileInput}
            />
            <Button
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
            >
              {uploadMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-1.5" />
              )}
              Upload
            </Button>
          </div>

          {/* Main area */}
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar: folders */}
            <div className="w-48 border-r bg-muted/10 flex-shrink-0">
              <div className="p-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Folders</p>
                {['/', '/destinations', '/packages', '/blogs', '/misc'].map((f) => (
                  <button
                    key={f}
                    onClick={() => { setFolder(f); setPage(1) }}
                    className={`w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                      folder === f ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'
                    }`}
                  >
                    <FolderOpen className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{f === '/' ? 'All files' : f.replace('/', '')}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Asset grid */}
            <div
              className="flex-1 overflow-hidden"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
            >
              <ScrollArea className="h-full">
                {isLoading ? (
                  <div className="flex items-center justify-center h-48">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : assets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground">
                    <Upload className="h-12 w-12 opacity-30" />
                    <p className="text-sm">Drop files here or click Upload</p>
                  </div>
                ) : view === 'grid' ? (
                  <div className="p-4 grid grid-cols-4 gap-3">
                    {assets.map((asset) => (
                      <motion.div
                        key={asset.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                          selected?.id === asset.id
                            ? 'border-primary shadow-md'
                            : 'border-transparent hover:border-primary/40'
                        }`}
                        onClick={() => handleSelect(asset)}
                      >
                        <div className="aspect-square bg-muted">
                          {asset.mime_type.startsWith('image/') ? (
                            <img
                              src={asset.url}
                              alt={asset.alt_text ?? asset.filename}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <ImageIcon className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        {/* Hover actions */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5 gap-1">
                          <button
                            className="p-1 rounded bg-white/20 hover:bg-white/40 text-white"
                            onClick={(e) => { e.stopPropagation(); handleCopyUrl(asset) }}
                            title="Copy URL"
                          >
                            {copiedId === asset.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          </button>
                          <button
                            className="p-1 rounded bg-red-500/70 hover:bg-red-500 text-white ml-auto"
                            onClick={(e) => { e.stopPropagation(); deleteMutation.mutate({ id: asset.id, url: asset.url }) }}
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>

                        {selected?.id === asset.id && (
                          <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="divide-y">
                    {assets.map((asset) => (
                      <div
                        key={asset.id}
                        className={`flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-muted/30 transition-colors ${
                          selected?.id === asset.id ? 'bg-primary/5' : ''
                        }`}
                        onClick={() => handleSelect(asset)}
                      >
                        <div className="h-10 w-10 rounded bg-muted flex-shrink-0 overflow-hidden">
                          {asset.mime_type.startsWith('image/') ? (
                            <img src={asset.url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <ImageIcon className="h-full w-full p-2 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{asset.filename}</p>
                          <p className="text-xs text-muted-foreground">
                            {(asset.size / 1024).toFixed(1)} KB · {asset.folder}
                          </p>
                        </div>
                        <button
                          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                          onClick={(e) => { e.stopPropagation(); handleCopyUrl(asset) }}
                        >
                          {copiedId === asset.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </div>

        {/* Footer */}
        {!multiple && (
          <div className="flex items-center justify-between px-6 py-3 border-t bg-muted/10">
            <div>
              {selected && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs truncate max-w-xs">
                    {selected.filename}
                  </Badge>
                  <button onClick={() => setSelected(null)}>
                    <X className="h-3 w-3 text-muted-foreground" />
                  </button>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleConfirm} disabled={!selected}>
                Use Selected
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// Inline image picker trigger (for forms)
interface ImageFieldProps {
  label?: string
  value: string
  onChange: (url: string) => void
  folder?: string
}

export function ImageField({ label = 'Image', value, onChange, folder = '/' }: ImageFieldProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium">{label}</p>}
      <div className="flex items-center gap-3">
        {value ? (
          <div className="relative h-20 w-32 rounded-lg overflow-hidden border bg-muted">
            <img src={value} alt="" className="h-full w-full object-cover" />
            <button
              className="absolute top-1 right-1 p-0.5 rounded-full bg-black/60 text-white"
              onClick={() => onChange('')}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div
            className="h-20 w-32 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors bg-muted/30"
            onClick={() => setOpen(true)}
          >
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
        <Button variant="outline" size="sm" type="button" onClick={() => setOpen(true)}>
          {value ? 'Change' : 'Select Image'}
        </Button>
      </div>

      <MediaPicker
        open={open}
        onClose={() => setOpen(false)}
        onSelect={(asset) => { onChange(asset.url); setOpen(false) }}
        accept="image"
      />
    </div>
  )
}
