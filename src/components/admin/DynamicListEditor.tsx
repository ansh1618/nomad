import { useState } from 'react'
import { motion, AnimatePresence, Reorder } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  GripVertical,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Pencil,
  Check,
  X,
  RotateCcw,
  ClipboardPaste,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'

interface DynamicListEditorProps {
  title: string
  list: string[]
  originalList: string[]
  onChange: (items: string[]) => void
  iconType: 'check' | 'x'
  placeholder?: string
  maxChars?: number
}

export function DynamicListEditor({
  title,
  list,
  originalList,
  onChange,
  iconType,
  placeholder = 'Add new item...',
  maxChars = 120,
}: DynamicListEditorProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [inputValue, setInputValue] = useState('')
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const [showBulkPaste, setShowBulkPaste] = useState(false)
  const [bulkText, setBulkText] = useState('')

  // Helper to validate, trim and check for duplicates
  const validateItem = (val: string, itemsList: string[], ignoreIndex?: number): { ok: boolean; msg?: string } => {
    const trimmed = val.trim()
    if (!trimmed) {
      return { ok: false, msg: 'Item cannot be empty' }
    }
    if (trimmed.length > maxChars) {
      return { ok: false, msg: `Item exceeds maximum limit of ${maxChars} characters` }
    }
    const dupIndex = itemsList.findIndex((item, i) => item.trim().toLowerCase() === trimmed.toLowerCase() && i !== ignoreIndex)
    if (dupIndex !== -1) {
      return { ok: false, msg: 'This item already exists in the list' }
    }
    return { ok: true }
  };

  const handleAddItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = inputValue.trim()
    const check = validateItem(trimmed, list)
    if (!check.ok) {
      toast.warning(check.msg)
      return
    }
    onChange([...list, trimmed])
    setInputValue('')
  }

  const handleDeleteItem = (index: number) => {
    onChange(list.filter((_, i) => i !== index))
  }

  const handleStartEdit = (index: number) => {
    setEditingIndex(index)
    setEditingValue(list[index])
  }

  const handleSaveEdit = (index: number) => {
    const trimmed = editingValue.trim()
    const check = validateItem(trimmed, list, index)
    if (!check.ok) {
      toast.warning(check.msg)
      return
    }
    const updated = [...list]
    updated[index] = trimmed
    onChange(updated)
    setEditingIndex(null)
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const updated = [...list]
    const temp = updated[index]
    updated[index] = updated[index - 1]
    updated[index - 1] = temp
    onChange(updated)
  }

  const handleMoveDown = (index: number) => {
    if (index === list.length - 1) return
    const updated = [...list]
    const temp = updated[index]
    updated[index] = updated[index + 1]
    updated[index + 1] = temp
    onChange(updated)
  }

  const handleBulkPaste = () => {
    const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean)
    if (lines.length === 0) {
      toast.warning('Please enter some text to paste')
      return
    }

    const added: string[] = []
    const duplicates: string[] = []
    const tooLong: string[] = []

    const currentList = [...list]
    lines.forEach(line => {
      const check = validateItem(line, [...currentList, ...added])
      if (check.ok) {
        added.push(line)
      } else if (line.length > maxChars) {
        tooLong.push(line)
      } else {
        duplicates.push(line)
      }
    })

    if (added.length > 0) {
      onChange([...list, ...added])
      toast.success(`Successfully added ${added.length} items`)
    }
    if (duplicates.length > 0 || tooLong.length > 0) {
      toast.info(`Skipped ${duplicates.length} duplicate/invalid items`)
    }

    setBulkText('')
    setShowBulkPaste(false)
  }

  const handleReset = () => {
    onChange([...originalList])
    toast.info('List reset to last saved state')
  }

  const isListModified = JSON.stringify(list) !== JSON.stringify(originalList)

  return (
    <div className="border rounded-2xl bg-white shadow-sm overflow-hidden font-poppins">
      {/* Header Panel */}
      <div className="flex items-center justify-between px-5 py-4 border-b bg-muted/10">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 font-bold text-sm text-foreground focus:outline-none"
        >
          {isOpen ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronUp className="h-4 w-4 shrink-0" />}
          {title} <span className="text-xs text-muted-foreground font-normal">({list.length} items)</span>
        </button>

        <div className="flex items-center gap-2">
          {isListModified && (
            <Button
              type="button"
              variant="outline"
              size="xs"
              className="h-8 gap-1.5 text-[11px]"
              onClick={handleReset}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset to Last Saved
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="xs"
            className="h-8 gap-1.5 text-[11px] text-indigo-600 hover:text-indigo-700"
            onClick={() => setShowBulkPaste(!showBulkPaste)}
          >
            <ClipboardPaste className="h-3.5 w-3.5" />
            Bulk Paste
          </Button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-5 space-y-4">
              {/* Bulk Paste Area */}
              {showBulkPaste && (
                <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-3">
                  <Label className="text-xs font-semibold text-indigo-900 flex items-center gap-1.5">
                    <ClipboardPaste className="h-4 w-4" /> Bulk Paste Items (One item per line)
                  </Label>
                  <Textarea
                    placeholder={`Paste your list here...\nExample:\nItem 1\nItem 2`}
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    className="min-h-[100px] bg-white font-mono text-xs"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowBulkPaste(false)}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={handleBulkPaste}
                      className="bg-indigo-600 hover:bg-indigo-700 text-xs"
                    >
                      Import Items
                    </Button>
                  </div>
                </div>
              )}

              {/* Add New Item Form */}
              <form onSubmit={handleAddItem} className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    placeholder={placeholder}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="h-9 pr-16 text-xs"
                  />
                  <span className="absolute right-2.5 top-2.5 text-[10px] text-muted-foreground">
                    {inputValue.length}/{maxChars}
                  </span>
                </div>
                <Button type="submit" size="sm" className="h-9 gap-1.5 text-xs">
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </form>

              {/* Items List */}
              {list.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-xl bg-muted/10">
                  <AlertTriangle className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No items configured yet.</p>
                </div>
              ) : (
                <Reorder.Group
                  axis="y"
                  values={list}
                  onReorder={onChange}
                  className="space-y-2 max-h-[300px] overflow-y-auto pr-1"
                >
                  {list.map((item, index) => {
                    const isEditing = editingIndex === index
                    return (
                      <Reorder.Item
                        key={item}
                        value={item}
                        dragListener={!isEditing}
                        className="flex items-center gap-2 p-2 bg-muted/20 border rounded-lg hover:bg-muted/30 transition-colors"
                      >
                        <div className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground">
                          <GripVertical className="h-3.5 w-3.5" />
                        </div>

                        {/* Icon Indicator */}
                        <div className="shrink-0 flex items-center justify-center h-5 w-5 rounded-full bg-slate-100 border">
                          {iconType === 'check' ? (
                            <span className="text-[10px] text-emerald-600 font-bold">✓</span>
                          ) : (
                            <span className="text-[10px] text-red-500 font-bold">✕</span>
                          )}
                        </div>

                        {/* Item Text or Inline Edit */}
                        <div className="flex-1 min-w-0">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                className="h-8 text-xs flex-1"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveEdit(index)
                                  if (e.key === 'Escape') setEditingIndex(null)
                                }}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-emerald-600"
                                onClick={() => handleSaveEdit(index)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-red-500"
                                onClick={() => setEditingIndex(null)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <p
                              className="text-xs text-foreground truncate cursor-pointer font-medium"
                              onDoubleClick={() => handleStartEdit(index)}
                              title="Double click to edit"
                            >
                              {item}
                            </p>
                          )}
                        </div>

                        {/* Controls */}
                        {!isEditing && (
                          <div className="flex items-center gap-0.5 opacity-60 hover:opacity-100 transition-opacity shrink-0">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              disabled={index === 0}
                              onClick={() => handleMoveUp(index)}
                            >
                              <ChevronUp className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              disabled={index === list.length - 1}
                              onClick={() => handleMoveDown(index)}
                            >
                              <ChevronDown className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-indigo-600"
                              onClick={() => handleStartEdit(index)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => handleDeleteItem(index)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </Reorder.Item>
                    )
                  })}
                </Reorder.Group>
              )}

              {/* Frontend Live Preview */}
              {list.length > 0 && (
                <div className="pt-4 border-t space-y-2">
                  <h4 className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Frontend Live Preview</h4>
                  <div className="p-4 border rounded-xl bg-[#F8F7F3] space-y-2">
                    <h5 className="text-[11px] font-poppins font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                      {iconType === 'check' ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-700 font-bold" /> What's Included
                        </>
                      ) : (
                        <>
                          <X className="h-3.5 w-3.5 text-red-600 font-bold" /> What's Excluded
                        </>
                      )}
                    </h5>
                    <ul className="space-y-2 font-poppins">
                      {list.slice(0, 3).map((item, idx) => (
                        <li key={idx} className="flex gap-2 text-[10px] text-muted-foreground leading-relaxed">
                          <span className={`${iconType === 'check' ? 'text-emerald-600' : 'text-red-500'} shrink-0 font-bold`}>
                            {iconType === 'check' ? '✓' : '✗'}
                          </span>
                          <span className="truncate">{item}</span>
                        </li>
                      ))}
                      {list.length > 3 && (
                        <li className="text-[9px] text-muted-foreground italic pl-3">
                          + {list.length - 3} more items...
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
