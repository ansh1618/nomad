import { supabase } from '@/lib/supabase'
import type { PaginatedResult, PaginationParams } from '@/types/supabase'

// ============================================================
// EMPLOYEE TYPES
// ============================================================
export interface Employee {
  id: string
  full_name: string
  email: string | null
  phone: string
  role: string
  employment_status: string
  date_of_birth: string | null
  gender: string | null
  address: string | null
  city: string | null
  salary: number | null
  joining_date: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  profile_photo: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Expense {
  id: string
  title: string
  category: string
  amount: number
  currency: string
  expense_date: string
  departure_id: string | null
  employee_id: string | null
  payment_method: string | null
  paid_to: string | null
  receipt_url: string | null
  status: string
  approved_by: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Invoice {
  id: string
  invoice_number: string | null
  booking_id: string | null
  customer_name: string
  customer_email: string | null
  customer_phone: string | null
  trip_name: string | null
  departure_date: string | null
  base_amount: number
  discount_amount: number
  gst_rate: number
  gst_amount: number
  total_amount: number
  amount_paid: number
  balance_due: number
  status: string
  issued_at: string | null
  pdf_url: string | null
  created_at: string
  updated_at: string
}

export interface Refund {
  id: string
  booking_id: string
  amount: number
  reason: string
  status: string
  refund_method: string | null
  gateway_refund_id: string | null
  processed_by: string | null
  customer_name: string | null
  customer_phone: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface AuditLog {
  id: string
  admin_id: string | null
  admin_email: string | null
  action: string
  table_name: string | null
  record_id: string | null
  old_data: any
  new_data: any
  ip_address: string | null
  created_at: string
}

// ============================================================
// EMPLOYEES
// ============================================================
export async function getEmployees(params: PaginationParams = {}): Promise<PaginatedResult<Employee>> {
  const { page = 1, pageSize = 20, search, sortBy = 'created_at', sortDir = 'desc' } = params

  let query = supabase.from('employees').select('*', { count: 'exact' })

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
  }

  query = query.order(sortBy, { ascending: sortDir === 'asc' })
  query = query.range((page - 1) * pageSize, page * pageSize - 1)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return {
    data: (data ?? []) as Employee[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}

export async function getEmployeeById(id: string): Promise<Employee | null> {
  const { data, error } = await supabase.from('employees').select('*').eq('id', id).single()
  if (error) { if (error.code === 'PGRST116') return null; throw new Error(error.message) }
  return data as Employee
}

export async function createEmployee(input: Partial<Employee>): Promise<Employee> {
  const { data, error } = await supabase.from('employees').insert(input).select().single()
  if (error) throw new Error(error.message)
  return data as Employee
}

export async function updateEmployee(id: string, input: Partial<Employee>): Promise<Employee> {
  const { data, error } = await supabase.from('employees').update(input).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  return data as Employee
}

export async function deleteEmployee(id: string): Promise<void> {
  const { error } = await supabase.from('employees').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ============================================================
// EXPENSES
// ============================================================
export async function getExpenses(params: PaginationParams & { departureId?: string; status?: string; category?: string } = {}): Promise<PaginatedResult<Expense>> {
  const { page = 1, pageSize = 20, search, sortBy = 'expense_date', sortDir = 'desc', departureId, status, category } = params

  let query = supabase.from('expenses').select('*', { count: 'exact' })

  if (search) query = query.or(`title.ilike.%${search}%,paid_to.ilike.%${search}%`)
  if (departureId) query = query.eq('departure_id', departureId)
  if (status) query = query.eq('status', status)
  if (category) query = query.eq('category', category)

  query = query.order(sortBy, { ascending: sortDir === 'asc' })
  query = query.range((page - 1) * pageSize, page * pageSize - 1)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return {
    data: (data ?? []) as Expense[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}

export async function createExpense(input: Partial<Expense>): Promise<Expense> {
  const { data, error } = await supabase.from('expenses').insert(input).select().single()
  if (error) throw new Error(error.message)
  return data as Expense
}

export async function updateExpense(id: string, input: Partial<Expense>): Promise<Expense> {
  const { data, error } = await supabase.from('expenses').update(input).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  return data as Expense
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase.from('expenses').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function getExpenseSummary(): Promise<{ total: number; byCategory: Record<string, number>; pending: number }> {
  const { data, error } = await supabase
    .from('expenses')
    .select('category, amount, status')

  if (error) throw new Error(error.message)

  const total = (data ?? []).filter(e => e.status === 'PAID').reduce((sum, e) => sum + (e.amount ?? 0), 0)
  const pending = (data ?? []).filter(e => e.status === 'PENDING').reduce((sum, e) => sum + (e.amount ?? 0), 0)
  const byCategory = (data ?? []).reduce((acc: Record<string, number>, e) => {
    if (e.status === 'PAID') acc[e.category] = (acc[e.category] ?? 0) + (e.amount ?? 0)
    return acc
  }, {})

  return { total, byCategory, pending }
}

// ============================================================
// INVOICES
// ============================================================
export async function getInvoices(params: PaginationParams & { status?: string } = {}): Promise<PaginatedResult<Invoice>> {
  const { page = 1, pageSize = 20, search, sortBy = 'created_at', sortDir = 'desc', status } = params

  let query = supabase.from('invoices').select('*', { count: 'exact' })

  if (search) query = query.or(`invoice_number.ilike.%${search}%,customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%`)
  if (status) query = query.eq('status', status)

  query = query.order(sortBy, { ascending: sortDir === 'asc' })
  query = query.range((page - 1) * pageSize, page * pageSize - 1)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return {
    data: (data ?? []) as Invoice[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  const { data, error } = await supabase.from('invoices').select('*').eq('id', id).single()
  if (error) { if (error.code === 'PGRST116') return null; throw new Error(error.message) }
  return data as Invoice
}

export async function createInvoice(input: Partial<Invoice>): Promise<Invoice> {
  const { data, error } = await supabase.from('invoices').insert(input).select().single()
  if (error) throw new Error(error.message)
  return data as Invoice
}

export async function updateInvoice(id: string, input: Partial<Invoice>): Promise<Invoice> {
  const { data, error } = await supabase.from('invoices').update(input).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  return data as Invoice
}

// ============================================================
// REFUNDS
// ============================================================
export async function getRefunds(params: PaginationParams & { status?: string } = {}): Promise<PaginatedResult<Refund>> {
  const { page = 1, pageSize = 20, search, sortBy = 'created_at', sortDir = 'desc', status } = params

  let query = supabase.from('refunds').select('*', { count: 'exact' })

  if (search) query = query.or(`customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%`)
  if (status) query = query.eq('status', status)

  query = query.order(sortBy, { ascending: sortDir === 'asc' })
  query = query.range((page - 1) * pageSize, page * pageSize - 1)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return {
    data: (data ?? []) as Refund[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}

export async function updateRefund(id: string, input: Partial<Refund>): Promise<Refund> {
  const { data, error } = await supabase.from('refunds').update(input).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  return data as Refund
}

// ============================================================
// AUDIT LOGS
// ============================================================
export async function getAuditLogs(params: PaginationParams & { action?: string } = {}): Promise<PaginatedResult<AuditLog>> {
  const { page = 1, pageSize = 50, search, sortBy = 'created_at', sortDir = 'desc', action } = params

  let query = supabase.from('audit_logs').select('*', { count: 'exact' })

  if (search) query = query.or(`admin_email.ilike.%${search}%,action.ilike.%${search}%,table_name.ilike.%${search}%`)
  if (action) query = query.eq('action', action)

  query = query.order(sortBy, { ascending: sortDir === 'asc' })
  query = query.range((page - 1) * pageSize, page * pageSize - 1)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return {
    data: (data ?? []) as AuditLog[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}

// ============================================================
// ADMIN MANAGEMENT (Super Admin)
// ============================================================
export interface AdminRecord {
  id: string
  email: string
  role: string
  full_name: string | null
  is_active: boolean
  created_at: string
}

export async function getAdmins(): Promise<AdminRecord[]> {
  const { data, error } = await supabase
    .from('admins')
    .select('id, email, role, full_name, is_active, created_at')
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as AdminRecord[]
}

export async function updateAdminStatus(id: string, is_active: boolean): Promise<void> {
  const { error } = await supabase.from('admins').update({ is_active }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function updateAdminRole(id: string, role: string): Promise<void> {
  const { error } = await supabase.from('admins').update({ role }).eq('id', id)
  if (error) throw new Error(error.message)
}
