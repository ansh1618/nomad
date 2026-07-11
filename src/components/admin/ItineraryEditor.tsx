'use client'

import { useState } from 'react'
import { motion, AnimatePresence, Reorder } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { ImageField } from '@/components/admin/MediaPicker'
import {
  GripVertical,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Star,
  UtensilsCrossed,
  Coffee,
  Moon,
} from 'lucide-react'
import type { ItineraryDay, MealPlan } from '@/types/supabase'

export type ItineraryDayForm = Omit<ItineraryDay, 'id' | 'journey_id' | 'created_at' | 'updated_at'>

interface ItineraryEditorProps {
  value: ItineraryDayForm[]
  onChange: (days: ItineraryDayForm[]) => void
}

const defaultDay = (dayNumber: number, sortOrder: number): ItineraryDayForm => ({
  day_number: dayNumber,
  title: `Day ${dayNumber}`,
  description: '',
  meals: { breakfast: false, lunch: false, dinner: false },
  stay: '',
  transport: '',
  image_url: null,
  is_highlight: false,
  sort_order: sortOrder,
})

export function ItineraryEditor({ value, onChange }: ItineraryEditorProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0)

  const addDay = () => {
    const newDay = defaultDay(value.length + 1, value.length)
    onChange([...value, newDay])
    setExpandedIndex(value.length)
  }

  const removeDay = (index: number) => {
    const updated = value.filter((_, i) => i !== index).map((d, i) => ({
      ...d,
      day_number: i + 1,
      sort_order: i,
    }))
    onChange(updated)
    setExpandedIndex(null)
  }

  const updateDay = (index: number, field: keyof ItineraryDayForm, fieldValue: unknown) => {
    const updated = [...value]
    updated[index] = { ...updated[index], [field]: fieldValue }
    onChange(updated)
  }

  const updateMeal = (index: number, meal: keyof MealPlan, checked: boolean) => {
    const updated = [...value]
    updated[index] = {
      ...updated[index],
      meals: { ...updated[index].meals, [meal]: checked } as MealPlan,
    }
    onChange(updated)
  }

  const handleReorder = (newOrder: ItineraryDayForm[]) => {
    const reordered = newOrder.map((d, i) => ({
      ...d,
      day_number: i + 1,
      sort_order: i,
    }))
    onChange(reordered)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Day-by-Day Itinerary</h3>
          <p className="text-xs text-muted-foreground">Drag to reorder · {value.length} day{value.length !== 1 ? 's' : ''}</p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={addDay}>
          <Plus className="h-4 w-4 mr-1.5" />
          Add Day
        </Button>
      </div>

      {value.length === 0 ? (
        <div className="border-2 border-dashed rounded-xl p-8 text-center text-muted-foreground">
          <p className="text-sm">No itinerary days yet.</p>
          <Button type="button" variant="ghost" size="sm" onClick={addDay} className="mt-2">
            + Add Day 1
          </Button>
        </div>
      ) : (
        <Reorder.Group axis="y" values={value} onReorder={handleReorder} className="space-y-2">
          {value.map((day, index) => (
            <Reorder.Item key={`${day.day_number}-${day.sort_order}`} value={day}>
              <motion.div
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="border rounded-xl bg-card overflow-hidden"
              >
                {/* Header */}
                <div
                  className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/20 transition-colors"
                  onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                >
                  <div className="cursor-grab active:cursor-grabbing text-muted-foreground p-1">
                    <GripVertical className="h-4 w-4" />
                  </div>

                  <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {day.day_number}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{day.title || `Day ${day.day_number}`}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {day.meals?.breakfast && <Coffee className="h-3 w-3 text-amber-500" />}
                      {day.meals?.lunch && <UtensilsCrossed className="h-3 w-3 text-green-500" />}
                      {day.meals?.dinner && <Moon className="h-3 w-3 text-blue-500" />}
                      {day.is_highlight && <Star className="h-3 w-3 text-gold fill-gold" />}
                      {day.stay && <span className="text-xs text-muted-foreground truncate">Stay: {day.stay}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="p-1.5 rounded hover:bg-red-100 text-muted-foreground hover:text-destructive transition-colors"
                      onClick={(e) => { e.stopPropagation(); removeDay(index) }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    {expandedIndex === index ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Expanded editor */}
                <AnimatePresence>
                  {expandedIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 pt-0 border-t bg-muted/10 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Day Title *</Label>
                            <Input
                              value={day.title}
                              onChange={(e) => updateDay(index, 'title', e.target.value)}
                              placeholder="e.g., Arrival & Manali Exploration"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Transport</Label>
                            <Input
                              value={day.transport ?? ''}
                              onChange={(e) => updateDay(index, 'transport', e.target.value)}
                              placeholder="e.g., Overnight bus from Delhi"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Description</Label>
                          <Textarea
                            value={day.description ?? ''}
                            onChange={(e) => updateDay(index, 'description', e.target.value)}
                            placeholder="Describe the day's activities in detail..."
                            rows={4}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Stay / Accommodation</Label>
                            <Input
                              value={day.stay ?? ''}
                              onChange={(e) => updateDay(index, 'stay', e.target.value)}
                              placeholder="e.g., Hotel Snow View, Manali"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-xs">Meals Included</Label>
                            <div className="flex items-center gap-4 pt-1">
                              {([['breakfast', 'B'], ['lunch', 'L'], ['dinner', 'D']] as const).map(([meal, short]) => (
                                <label key={meal} className="flex items-center gap-1.5 cursor-pointer">
                                  <Switch
                                    checked={day.meals?.[meal as keyof MealPlan] ?? false}
                                    onCheckedChange={(v) => updateMeal(index, meal as keyof MealPlan, v)}
                                    className="scale-75"
                                  />
                                  <span className="text-xs font-medium">{short}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Switch
                              checked={day.is_highlight}
                              onCheckedChange={(v) => updateDay(index, 'is_highlight', v)}
                            />
                            <div>
                              <p className="text-sm font-medium">Highlight Day</p>
                              <p className="text-xs text-muted-foreground">Mark as a must-see day</p>
                            </div>
                          </label>
                        </div>

                        <ImageField
                          label="Day Image (optional)"
                          value={day.image_url ?? ''}
                          onChange={(url) => updateDay(index, 'image_url', url || null)}
                          folder="/packages"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )}

      {value.length > 0 && (
        <Button type="button" variant="outline" className="w-full" onClick={addDay}>
          <Plus className="h-4 w-4 mr-1.5" />
          Add Day {value.length + 1}
        </Button>
      )}
    </div>
  )
}
