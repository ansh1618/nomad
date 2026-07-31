import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'motion/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import type { Review } from '@/types/reviews'
import {
  getAdminReviewsList,
  adminApproveReview,
  adminRejectReview,
  adminFeatureReview,
  addReviewReply,
} from '@/lib/reviews-client'
import { toast } from 'sonner'
import {
  Star,
  Check,
  X,
  MessageSquare,
  Trash2,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  BarChart3,
  ThumbsUp,
  GraduationCap,
  Award,
  Building,
  Bus,
} from 'lucide-react'
import { ReviewStarRating } from '@/components/site/ReviewStarRating'

export const Route = createFileRoute('/admin/reviews')({
  component: ReviewsPage,
})

function ReviewsPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<'ALL' | 'PENDING' | 'AI_FLAGGED' | 'APPROVED' | 'REJECTED' | 'FEATURED' | 'ANALYTICS'>('ALL')
  const [search, setSearch] = useState('')

  // Reply Drawer State
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null)
  const [replyRole, setReplyRole] = useState<'Nomadik Team' | 'Trip Captain' | 'Operations Team' | 'Support Specialist'>('Nomadik Team')
  const [replyInput, setReplyInput] = useState('')

  const { data: reviewsList = [], refetch } = useQuery({
    queryKey: ['admin_reviews', tab, search],
    queryFn: () => getAdminReviewsList({ status: tab, search }),
  })

  const handleApprove = async (id: string) => {
    await adminApproveReview(id)
    toast.success('Review approved and published!')
    refetch()
  }

  const handleReject = async (id: string) => {
    await adminRejectReview(id)
    toast.success('Review moved to rejected queue.')
    refetch()
  }

  const handleToggleFeature = async (id: string, current: boolean) => {
    await adminFeatureReview(id, !current)
    toast.success(!current ? 'Review featured on Homepage!' : 'Unfeatured review.')
    refetch()
  }

  const handleSendReply = async (id: string) => {
    if (!replyInput.trim()) return
    const authorName = replyRole === 'Trip Captain' ? 'Captain Rohit' : replyRole === 'Operations Team' ? 'Nomadik Ops' : 'Nomadik Team'
    await addReviewReply(id, replyInput, replyRole, authorName)
    toast.success(`Reply posted as ${replyRole}!`)
    setReplyInput('')
    setActiveReplyId(null)
    refetch()
  }

  return (
    <div className="p-6 sm:p-8 space-y-6 font-poppins text-left">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
            REVIEW MODERATION & ANALYTICS
          </span>
          <h1 className="text-3xl font-bold font-display text-[#102A43] mt-1">
            Reviews Control Center
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Approve verified traveler reviews, monitor AI spam alerts, feature highlights, and post official replies.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-2xl text-center">
            <span className="text-[10px] uppercase font-bold text-emerald-800 block">Avg Rating</span>
            <span className="text-lg font-bold text-emerald-950 font-display">4.9 ★</span>
          </div>
          <div className="bg-amber-50 border border-amber-200 px-3.5 py-2 rounded-2xl text-center">
            <span className="text-[10px] uppercase font-bold text-amber-800 block">Pending Queue</span>
            <span className="text-lg font-bold text-amber-950 font-display">2</span>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
        {[
          { key: 'ALL', label: 'All Reviews' },
          { key: 'PENDING', label: 'Pending Moderation ⏳' },
          { key: 'AI_FLAGGED', label: 'AI Spam Flagged 🤖' },
          { key: 'APPROVED', label: 'Approved & Published' },
          { key: 'FEATURED', label: 'Featured ★' },
          { key: 'ANALYTICS', label: 'Analytics Dashboard 📊' },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key as any)}
            className={`px-4 py-2.5 rounded-xl transition-all shrink-0 ${
              tab === t.key
                ? 'bg-[#102A43] text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Analytics Dashboard View */}
      {tab === 'ANALYTICS' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl p-6 border border-[#E4E2DA] shadow-soft space-y-2">
              <span className="text-xs font-bold uppercase text-slate-500">Overall Average Score</span>
              <div className="text-4xl font-display font-bold text-amber-500">4.92 ★</div>
              <p className="text-xs text-slate-600">Based on 1,286 verified bookings across 5 destinations.</p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-[#E4E2DA] shadow-soft space-y-2">
              <span className="text-xs font-bold uppercase text-slate-500">Most Loved Aspect</span>
              <div className="text-2xl font-display font-bold text-[#102A43]">Trip Captains (5.0★)</div>
              <p className="text-xs text-slate-600">420+ compliments for mountain safety & guide warmth.</p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-[#E4E2DA] shadow-soft space-y-2">
              <span className="text-xs font-bold uppercase text-slate-500">Weekly Growth</span>
              <div className="text-3xl font-display font-bold text-emerald-600">+14% New Reviews</div>
              <p className="text-xs text-slate-600">Average response time: 4.2 hours.</p>
            </div>
          </div>
        </div>
      ) : (
        /* Reviews List Queue */
        <div className="space-y-4">
          {reviewsList.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border text-slate-500 font-poppins">
              No reviews found in this moderation tab.
            </div>
          ) : (
            reviewsList.map((rev) => (
              <div
                key={rev.id}
                className="bg-white rounded-3xl p-6 border border-[#E4E2DA] shadow-soft space-y-4 transition-all hover:border-amber-400"
              >
                {/* Top Details */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={rev.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80'}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover border"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-[#102A43] text-sm">{rev.author_name}</h4>
                        {rev.college && (
                          <span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                            🎓 {rev.college}
                          </span>
                        )}
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {rev.status}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">{rev.journey_name || rev.journey_id} · {rev.trip_date}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <ReviewStarRating value={rev.overall_rating} size="sm" showValueLabel />
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-1">
                  {rev.title && <h5 className="font-bold text-slate-900 text-sm">"{rev.title}"</h5>}
                  <p className="text-xs text-slate-700 leading-relaxed font-poppins">
                    {rev.review || rev.content}
                  </p>
                </div>

                {/* Official Replies */}
                {rev.replies && rev.replies.length > 0 && (
                  <div className="bg-slate-50 p-3 rounded-2xl border text-xs space-y-1">
                    {rev.replies.map((rep) => (
                      <div key={rep.id} className="text-slate-700">
                        <span className="font-bold text-[#102A43]">{rep.author_name} ({rep.role}):</span> "{rep.reply_text}"
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions Footer */}
                <div className="pt-3 border-t flex items-center justify-between text-xs flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700">
                      <Switch
                        checked={!!(rev.featured || rev.is_featured)}
                        onCheckedChange={() => handleToggleFeature(rev.id, !!(rev.featured || rev.is_featured))}
                      />
                      <span>Featured on Homepage</span>
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setActiveReplyId(activeReplyId === rev.id ? null : rev.id)}
                      className="text-xs font-bold text-accent"
                    >
                      <MessageSquare className="h-3.5 w-3.5 mr-1" /> Reply
                    </Button>

                    {rev.status !== 'approved' && (
                      <Button
                        size="sm"
                        onClick={() => handleApprove(rev.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                      >
                        <Check className="h-3.5 w-3.5 mr-1" /> Approve
                      </Button>
                    )}

                    {rev.status !== 'rejected' && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(rev.id)}
                        className="text-xs font-bold"
                      >
                        <X className="h-3.5 w-3.5 mr-1" /> Reject
                      </Button>
                    )}
                  </div>
                </div>

                {/* Reply Editor Drawer */}
                {activeReplyId === rev.id && (
                  <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-200/80 space-y-2 text-xs pt-3">
                    <div className="flex gap-2">
                      <select
                        value={replyRole}
                        onChange={(e) => setReplyRole(e.target.value as any)}
                        className="p-1.5 border rounded-lg bg-white font-bold text-slate-800 text-[11px]"
                      >
                        <option value="Nomadik Team">Nomadik Team</option>
                        <option value="Trip Captain">Trip Captain</option>
                        <option value="Operations Team">Operations Team</option>
                        <option value="Support Specialist">Support Specialist</option>
                      </select>
                    </div>
                    <textarea
                      value={replyInput}
                      onChange={(e) => setReplyInput(e.target.value)}
                      placeholder="Type official response..."
                      className="w-full p-2.5 border rounded-xl bg-white text-xs h-16 focus:outline-none"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setActiveReplyId(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSendReply(rev.id)}
                        className="bg-[#102A43] text-white font-bold"
                      >
                        Send Reply
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
