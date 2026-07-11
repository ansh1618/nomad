import { createFileRoute, Navigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAdminAuth } from '@/hooks/use-admin-auth'
import { getAdmins, updateAdminStatus, updateAdminRole } from '@/lib/queries/erp'
import type { AdminRecord } from '@/lib/queries/erp'
import { toast } from 'sonner'
import {
  Shield, UserCheck, UserX, Crown, AlertTriangle,
  Users, Lock, History, ToggleLeft, ToggleRight,
} from 'lucide-react'

export const Route = createFileRoute('/admin/super-admin')({
  component: SuperAdminPage,
})

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
  ADMIN: 'bg-purple-100 text-purple-700',
  TRIP_MANAGER: 'bg-blue-100 text-blue-700',
  SALES: 'bg-teal-100 text-teal-700',
  SUPPORT: 'bg-green-100 text-green-700',
  ACCOUNTANT: 'bg-orange-100 text-orange-700',
  MARKETING: 'bg-pink-100 text-pink-700',
  TRIP_CAPTAIN: 'bg-indigo-100 text-indigo-700',
  OPERATIONS: 'bg-slate-100 text-slate-700',
}

function SuperAdminPage() {
  const { admin: currentAdmin } = useAdminAuth()
  const qc = useQueryClient()
  const [updating, setUpdating] = useState<string | null>(null)

  // Only SUPER_ADMIN can access this page
  if (currentAdmin && currentAdmin.role !== 'SUPER_ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="p-4 rounded-full bg-red-50 text-red-500"><Lock className="h-8 w-8" /></div>
        <h2 className="text-xl font-bold font-poppins">Access Restricted</h2>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          Only SUPER_ADMIN accounts can access the Admin Management panel.
          Contact your system administrator for access.
        </p>
      </div>
    )
  }

  const { data: admins = [], isLoading } = useQuery({
    queryKey: ['admins_list'],
    queryFn: getAdmins,
  })

  const handleToggleActive = async (a: AdminRecord) => {
    if (a.id === currentAdmin?.id) {
      toast.error('You cannot deactivate your own account')
      return
    }
    setUpdating(a.id)
    try {
      await updateAdminStatus(a.id, !a.is_active)
      qc.invalidateQueries({ queryKey: ['admins_list'] })
      toast.success(`${a.email} ${!a.is_active ? 'activated' : 'deactivated'}`)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setUpdating(null)
    }
  }

  const handleRoleChange = async (a: AdminRecord, newRole: string) => {
    if (a.id === currentAdmin?.id) {
      toast.error('You cannot change your own role')
      return
    }
    setUpdating(a.id)
    try {
      await updateAdminRole(a.id, newRole)
      qc.invalidateQueries({ queryKey: ['admins_list'] })
      toast.success(`${a.email} role updated to ${newRole}`)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setUpdating(null)
    }
  }

  const activeCount = admins.filter((a) => a.is_active).length

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Crown className="h-5 w-5 text-yellow-500" />
            <h1 className="text-2xl font-bold font-poppins text-foreground">Admin Management</h1>
          </div>
          <p className="text-sm text-muted-foreground">Manage admin team members, roles, and access permissions.</p>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
        <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold">Super Admin Zone</p>
          <p className="text-amber-700 mt-0.5">Changes here immediately affect system access. Deactivating an account will log the user out instantly. Role changes take effect at next login.</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Admins', value: admins.length, icon: Users, color: 'text-primary' },
          { label: 'Active', value: activeCount, icon: UserCheck, color: 'text-emerald-600' },
          { label: 'Deactivated', value: admins.length - activeCount, icon: UserX, color: 'text-red-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-border rounded-xl p-4 flex items-center gap-4">
            <div className={`p-2 rounded-lg bg-muted ${color}`}><Icon className="h-5 w-5" /></div>
            <div><p className="text-2xl font-bold font-poppins">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>
          </motion.div>
        ))}
      </div>

      {/* Admin Records */}
      {isLoading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : (
        <div className="space-y-3">
          {admins.map((a) => {
            const isMe = a.id === currentAdmin?.id
            const isUpdating = updating === a.id
            return (
              <motion.div key={a.id}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className={`bg-white border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${!a.is_active ? 'opacity-60' : ''} ${isMe ? 'border-primary/30 bg-primary/5' : 'border-border'}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                    {(a.full_name ?? a.email).slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{a.full_name || a.email}</p>
                      {isMe && <span className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded font-semibold">YOU</span>}
                      {!a.is_active && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-semibold">INACTIVE</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">{a.email}</p>
                    <p className="text-xs text-muted-foreground">Added: {new Date(a.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 ml-auto">
                  {/* Role Selector */}
                  <Select
                    value={a.role}
                    onValueChange={(v) => handleRoleChange(a, v)}
                    disabled={isMe || isUpdating}
                  >
                    <SelectTrigger className="w-44 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['SUPER_ADMIN', 'ADMIN', 'TRIP_MANAGER', 'SALES', 'SUPPORT', 'ACCOUNTANT', 'MARKETING', 'OPERATIONS', 'TRIP_CAPTAIN'].map((r) => (
                        <SelectItem key={r} value={r} className="text-xs">{r.replace('_', ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Active Toggle */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(a)}
                    disabled={isMe || isUpdating}
                    className={`h-8 px-3 gap-1.5 text-xs font-semibold ${a.is_active ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {isUpdating ? (
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-b-2 border-current" />
                    ) : a.is_active ? (
                      <><ToggleRight className="h-4 w-4" />Active</>
                    ) : (
                      <><ToggleLeft className="h-4 w-4" />Inactive</>
                    )}
                  </Button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <div className="pt-2 border-t border-border">
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5" />
          To invite a new admin, create a Supabase auth user and insert a row into the <code className="bg-muted px-1 rounded">public.admins</code> table manually or via the Supabase dashboard.
        </p>
      </div>
    </div>
  )
}
