// ============================================================
// Dr Fit Veda — Mock Supabase Adapter
// Emulates Supabase query chains over mockDb in local/dev mode
// ============================================================
import { mockDb, MOCK_USERS, type MockUser } from '../mock-db'

export function createMockSupabaseClient(activeUser?: MockUser | null) {
  const user = activeUser || MOCK_USERS.customer

  return {
    auth: {
      async getUser() {
        return {
          data: {
            user: activeUser ? {
              id: activeUser.id,
              email: activeUser.email,
              role: activeUser.role,
              user_metadata: {
                role: activeUser.role,
                full_name: activeUser.full_name,
              },
              app_metadata: {
                role: activeUser.role,
              },
            } : null,
          },
          error: null,
        }
      },
      async signInWithPassword({ email }: { email: string }) {
        const found = Object.values(MOCK_USERS).find(u => u.email.toLowerCase() === email.toLowerCase())
        if (found) {
          return { data: { user: { id: found.id, email: found.email }, session: {} }, error: null }
        }
        return { data: { user: null, session: null }, error: { message: 'Invalid credentials' } }
      },
      async signOut() {
        return { error: null }
      },
    },

    from(tableName: string) {
      return new MockQueryBuilder(tableName, user)
    },
  }
}

class MockQueryBuilder {
  private table: string
  private user: MockUser
  private filters: Array<(row: any) => boolean> = []
  private sortFn: ((a: any, b: any) => number) | null = null
  private limitCount: number | null = null
  private isSingle = false

  constructor(table: string, user: MockUser) {
    this.table = table
    this.user = user
  }

  select(fields?: string) {
    return this
  }

  eq(column: string, value: any) {
    this.filters.push((row: any) => {
      // Handle nested column check or direct
      return row[column] == value
    })
    return this
  }

  in(column: string, values: any[]) {
    this.filters.push((row: any) => {
      return values.includes(row[column])
    })
    return this
  }

  gte(column: string, value: any) {
    this.filters.push((row: any) => {
      return row[column] >= value
    })
    return this
  }

  order(column: string, options?: { ascending?: boolean }) {
    const asc = options?.ascending !== false
    this.sortFn = (a, b) => {
      if (a[column] < b[column]) return asc ? -1 : 1
      if (a[column] > b[column]) return asc ? 1 : -1
      return 0
    }
    return this
  }

  limit(count: number) {
    this.limitCount = count
    return this
  }

  single() {
    this.isSingle = true
    return this.then((res: any) => ({
      data: Array.isArray(res.data) ? (res.data[0] ?? null) : (res.data ?? null),
      error: null,
    }))
  }

  insert(payload: any) {
    const list = mockDb.state[this.table] = mockDb.state[this.table] || []
    const items = Array.isArray(payload) ? payload : [payload]
    const inserted = items.map((it, idx) => ({
      id: it.id || `mock-${Date.now()}-${idx}`,
      created_at: new Date().toISOString(),
      ...it,
    }))
    list.push(...inserted)

    const result = {
      data: Array.isArray(payload) ? inserted : inserted[0],
      error: null,
      select: () => ({
        single: () => Promise.resolve({ data: inserted[0], error: null }),
        then: (resolve: any) => resolve({ data: inserted, error: null }),
      }),
      then: (resolve: any) => resolve({ data: Array.isArray(payload) ? inserted : inserted[0], error: null }),
    }
    return result
  }

  update(payload: any) {
    const list = mockDb.state[this.table] = mockDb.state[this.table] || []
    let updatedRows: any[] = []

    mockDb.state[this.table] = list.map((row: any) => {
      const match = this.filters.every(f => f(row))
      if (match) {
        const updated = { ...row, ...payload, updated_at: new Date().toISOString() }
        updatedRows.push(updated)
        return updated
      }
      return row
    })

    const result = {
      data: updatedRows,
      error: null,
      eq: (col: string, val: any) => {
        this.eq(col, val)
        return this.update(payload)
      },
      select: () => ({
        single: () => Promise.resolve({ data: updatedRows[0] || null, error: null }),
        then: (resolve: any) => resolve({ data: updatedRows, error: null }),
      }),
      then: (resolve: any) => resolve({ data: updatedRows, error: null }),
    }
    return result
  }

  upsert(payload: any, options?: { onConflict?: string }) {
    const list = mockDb.state[this.table] = mockDb.state[this.table] || []
    const conflictKey = options?.onConflict || 'customer_id'

    const existingIdx = list.findIndex((row: any) => row[conflictKey] == payload[conflictKey])
    if (existingIdx >= 0) {
      list[existingIdx] = { ...list[existingIdx], ...payload, updated_at: new Date().toISOString() }
    } else {
      list.push({ id: `mock-${Date.now()}`, ...payload, created_at: new Date().toISOString() })
    }

    return {
      data: payload,
      error: null,
      then: (resolve: any) => resolve({ data: payload, error: null }),
    }
  }

  // Promise-like resolution when awaited
  async then(resolve: (result: { data: any; error: any }) => any, reject?: any) {
    try {
      let rows = [...(mockDb.state[this.table] || [])]

      // Apply filters
      for (const filter of this.filters) {
        rows = rows.filter(filter)
      }

      // Apply sort
      if (this.sortFn) {
        rows.sort(this.sortFn)
      }

      // Apply limit
      if (this.limitCount !== null) {
        rows = rows.slice(0, this.limitCount)
      }

      // Resolve relational joins for common Dr Fit Veda relations
      rows = rows.map(r => this.enrichRelations(r))

      const result = {
        data: this.isSingle ? (rows[0] ?? null) : rows,
        error: null,
      }
      return resolve(result)
    } catch (err: any) {
      if (reject) return reject(err)
      return resolve({ data: null, error: err })
    }
  }

  private enrichRelations(row: any, targetTable?: string): any {
    if (!row) return row
    const copy = { ...row }
    const tbl = targetTable || this.table

    if (tbl === 'customers') {
      copy.user_profiles = (mockDb.state.user_profiles || []).find((p: any) => p.id === row.user_id) || null
      copy.customer_profiles = (mockDb.state.customer_profiles || []).filter((p: any) => p.customer_id === row.id)
      copy.food_profiles = (mockDb.state.food_profiles || []).filter((p: any) => p.customer_id === row.id)
      copy.daily_check_ins = (mockDb.state.daily_check_ins || []).filter((c: any) => c.customer_id === row.id)
    }

    if (tbl === 'professionals') {
      copy.user_profiles = (mockDb.state.user_profiles || []).find((p: any) => p.id === row.user_id) || null
    }

    if (tbl === 'plans') {
      const versions = (mockDb.state.plan_versions || []).filter((v: any) => v.plan_id === row.id)
      copy.plan_versions = versions.map((v: any) => ({
        ...v,
        plan_items: (mockDb.state.plan_items || []).filter((pi: any) => pi.plan_version_id === v.id),
      }))
      const cust = (mockDb.state.customers || []).find((c: any) => c.id === row.customer_id)
      copy.customers = cust ? this.enrichRelations(cust, 'customers') : null
    }

    if (tbl === 'plan_versions') {
      copy.plan_items = (mockDb.state.plan_items || []).filter((pi: any) => pi.plan_version_id === row.id)
      copy.plans = (mockDb.state.plans || []).find((p: any) => p.id === row.plan_id) || null
    }

    if (tbl === 'professional_assignments') {
      const cust = (mockDb.state.customers || []).find((c: any) => c.id === row.customer_id)
      copy.customers = cust ? this.enrichRelations(cust, 'customers') : null
    }

    if (tbl === 'appointments') {
      const cust = (mockDb.state.customers || []).find((c: any) => c.id === row.customer_id)
      copy.customers = cust ? this.enrichRelations(cust, 'customers') : null
      copy.professionals = (mockDb.state.professionals || []).find((p: any) => p.id === row.professional_id) || null
      copy.consultation_notes = (mockDb.state.consultation_notes || []).filter((cn: any) => cn.appointment_id === row.id)
    }

    if (tbl === 'training_sessions') {
      const cust = (mockDb.state.customers || []).find((c: any) => c.id === row.customer_id)
      copy.customers = cust ? this.enrichRelations(cust, 'customers') : null
      copy.training_recordings = (mockDb.state.training_recordings || []).filter((tr: any) => tr.session_id === row.id)
    }

    if (tbl === 'weekly_reviews') {
      const cust = (mockDb.state.customers || []).find((c: any) => c.id === row.customer_id)
      copy.customers = cust ? this.enrichRelations(cust, 'customers') : null
      copy.doctor = (mockDb.state.professionals || []).find((p: any) => p.id === row.doctor_id) || null
    }

    if (tbl === 'compensation_rule_versions') {
      copy.payout_rule_components = (mockDb.state.payout_rule_components || []).filter((c: any) => c.rule_version_id === row.id)
    }

    return copy
  }
}
