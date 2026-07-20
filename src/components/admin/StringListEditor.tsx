import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'

export function StringListEditor({
  label,
  list,
  setList,
  placeholder,
}: {
  label: string
  list: string[]
  setList: (v: string[]) => void
  placeholder?: string
}) {
  const [inputValue, setInputValue] = useState('')

  const handleAdd = () => {
    const val = inputValue.trim()
    if (!val) return
    setList([...list, val])
    setInputValue('')
  }

  const handleRemove = (index: number) => {
    setList(list.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      <div className="space-y-2">
        {list.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="flex-1 text-sm p-2 bg-muted/30 rounded-md border">{item}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => handleRemove(i)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAdd()
            }
          }}
          placeholder={placeholder ?? `Add ${label.toLowerCase()}...`}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
