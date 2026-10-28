// ============================================================
// Dr Fit Veda — Supabase Adapter with Durable State Persistence
// Emulates relational Supabase query chains over mockDb.state
// while persisting all mutations to Supabase PostgreSQL via persistent-store.
// ============================================================
import { mockDb, MOCK_USERS, type MockUser } from '../mock-db'
import { loadPersistedState, savePersistedState } from '../persistent-store'

export function createMockSupabaseClient(activeUser?: MockUser | null) {
  const user = activeUser || MOCK_USERS.customer

  return {
    auth: {
      async getUser() {
        await loadPersistedState()
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
      async signInWithPassword({ email, password }: { email: string; password?: string }) {
        await loadPersistedState()
        const found = Object.values(MOCK_USERS).find(u => u.email.toLowerCase() === email.toLowerCase())
        if (found && (!password || !found.password || found.password === password)) {
          return { data: { user: { id: found.id, email: found.email }, session: {} }, error: null }
        }
        return { data: { user: null, session: null }, error: { message: 'Invalid credentials' } }
      },
      async signOut() {
        return { error: null }
      },
      admin: {
        async listUsers() {
          await loadPersistedState()
          const users = (mockDb.state.user_profiles || []).map((u: any) => ({
            id: u.id,
            email: u.email || '',
            phone: u.phone || '',
            user_metadata: { full_name: u.full_name, role: u.role, phone: u.phone },
          }))
          return { data: { users }, error: null }
        },
        async createUser(attrs: any) {
          await loadPersistedState()
          const newUser = {
            id: `u-${Date.now()}`,
            email: attrs.email || '',
            phone: attrs.phone || attrs.user_metadata?.phone || '',
            user_metadata: attrs.user_metadata || {},
          }
          return { data: { user: newUser }, error: null }
        },
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
  private rangeStart: number | null = null
  private rangeEnd: number | null = null
  private isSingle = false
  private isMaybeSingle = false
  private isHead = false
  private pendingOp: 'select' | 'insert' | 'update' | 'upsert' | 'delete' = 'select'
  private pendingPayload: any = null
  private pendingOptions: any = null

  constructor(table: string, user: MockUser) {
    this.table = table
    this.user = user
  }

  select(fields?: string, options?: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean }) {
    if (options?.head) {
      this.isHead = true
    }
    return this
  }

  eq(column: string, value: any) {
    this.filters.push((row: any) => row?.[column] == value)
    return this
  }

  neq(column: string, value: any) {
    this.filters.push((row: any) => row?.[column] != value)
    return this
  }

  in(column: string, values: any[]) {
    this.filters.push((row: any) => Array.isArray(values) && values.includes(row?.[column]))
    return this
  }

  is(column: string, value: any) {
    this.filters.push((row: any) => row?.[column] === value)
    return this
  }

  not(column: string, operator: string, value: any) {
    this.filters.push((row: any) => {
      if (operator === 'is') return row?.[column] !== value
      if (operator === 'eq') return row?.[column] != value
      if (operator === 'in' && Array.isArray(value)) return !value.includes(row?.[column])
      return true
    })
    return this
  }

  gte(column: string, value: any) {
    this.filters.push((row: any) => row?.[column] >= value)
    return this
  }

  gt(column: string, value: any) {
    this.filters.push((row: any) => row?.[column] > value)
    return this
  }

  lte(column: string, value: any) {
    this.filters.push((row: any) => row?.[column] <= value)
    return this
  }

  lt(column: string, value: any) {
    this.filters.push((row: any) => row?.[column] < value)
    return this
  }

  like(column: string, pattern: string) {
    const regex = new RegExp('^' + String(pattern).replace(/%/g, '.*').replace(/_/g, '.') + '$')
    this.filters.push((row: any) => regex.test(String(row?.[column] ?? '')))
    return this
  }

  ilike(column: string, pattern: string) {
    const regex = new RegExp('^' + String(pattern).replace(/%/g, '.*').replace(/_/g, '.') + '$', 'i')
    this.filters.push((row: any) => regex.test(String(row?.[column] ?? '')))
    return this
  }

  or(orFilterString: string) {
    // Support basic comma-separated conditions like "name.ilike.%foo%,category.ilike.%foo%"
    const parts = String(orFilterString).split(',').map(s => s.trim()).filter(Boolean)
    this.filters.push((row: any) => {
      return parts.some(part => {
        const [col, op, ...valParts] = part.split('.')
        const val = valParts.join('.')
        if (!col || !op) return true
        if (op === 'eq') return String(row?.[col] ?? '') === val
        if (op === 'ilike') {
          const regex = new RegExp('^' + val.replace(/%/g, '.*').replace(/_/g, '.') + '$', 'i')
          return regex.test(String(row?.[col] ?? ''))
        }
        return true
      })
    })
    return this
  }

  order(column: string, options?: { ascending?: boolean }) {
    const asc = options?.ascending !== false
    this.sortFn = (a, b) => {
      if ((a?.[column] ?? '') < (b?.[column] ?? '')) return asc ? -1 : 1
      if ((a?.[column] ?? '') > (b?.[column] ?? '')) return asc ? 1 : -1
      return 0
    }
    return this
  }

  limit(count: number) {
    this.limitCount = count
    return this
  }

  range(from: number, to: number) {
    this.rangeStart = from
    this.rangeEnd = to
    return this
  }

  single() {
    this.isSingle = true
    return this
  }

  maybeSingle() {
    this.isMaybeSingle = true
    return this
  }

  insert(payload: any) {
    this.pendingOp = 'insert'
    this.pendingPayload = payload
    return this
  }

  update(payload: any) {
    this.pendingOp = 'update'
    this.pendingPayload = payload
    return this
  }

  upsert(payload: any, options?: { onConflict?: string }) {
    this.pendingOp = 'upsert'
    this.pendingPayload = payload
    this.pendingOptions = options
    return this
  }

  delete() {
    this.pendingOp = 'delete'
    return this
  }

  // Promise-like resolution when awaited
  async then(resolve: (result: { data: any; error: any; count?: number }) => any, reject?: any) {
    try {
      await loadPersistedState()

      if (this.pendingOp === 'insert') {
        const list = (mockDb.state[this.table] = mockDb.state[this.table] || [])
        const items = Array.isArray(this.pendingPayload) ? this.pendingPayload : [this.pendingPayload]
        const inserted = items.map((it, idx) => ({
          id: it.id || `mock-${Date.now()}-${idx}`,
          created_at: it.created_at || new Date().toISOString(),
          ...it,
        }))
        list.push(...inserted)
        await savePersistedState(this.table)

        const data = this.isSingle || this.isMaybeSingle || !Array.isArray(this.pendingPayload)
          ? inserted[0] ?? null
          : inserted
        return resolve({ data, error: null, count: inserted.length })
      }

      if (this.pendingOp === 'update') {
        const list = (mockDb.state[this.table] = mockDb.state[this.table] || [])
        const updatedRows: any[] = []

        mockDb.state[this.table] = list.map((row: any) => {
          const match = this.filters.every(f => f(row))
          if (match) {
            const updated = { ...row, ...this.pendingPayload, updated_at: new Date().toISOString() }
            updatedRows.push(updated)
            return updated
          }
          return row
        })
        await savePersistedState(this.table)

        const data = this.isSingle || this.isMaybeSingle
          ? updatedRows[0] ?? null
          : updatedRows
        return resolve({ data, error: null, count: updatedRows.length })
      }

      if (this.pendingOp === 'upsert') {
        const list = (mockDb.state[this.table] = mockDb.state[this.table] || [])
        const conflictKey = this.pendingOptions?.onConflict || 'id'
        const items = Array.isArray(this.pendingPayload) ? this.pendingPayload : [this.pendingPayload]
        const upsertedRows: any[] = []

        for (const item of items) {
          const existingIdx = list.findIndex((row: any) =>
            row?.[conflictKey] !== undefined && row?.[conflictKey] == item?.[conflictKey]
          )
          if (existingIdx >= 0) {
            list[existingIdx] = {
              ...list[existingIdx],
              ...item,
              updated_at: new Date().toISOString(),
            }
            upsertedRows.push(list[existingIdx])
          } else {
            const created = {
              id: item.id || `mock-${Date.now()}`,
              created_at: new Date().toISOString(),
              ...item,
            }
            list.push(created)
            upsertedRows.push(created)
          }
        }
        await savePersistedState(this.table)

        const data = this.isSingle || this.isMaybeSingle || !Array.isArray(this.pendingPayload)
          ? upsertedRows[0] ?? null
          : upsertedRows
        return resolve({ data, error: null, count: upsertedRows.length })
      }

      if (this.pendingOp === 'delete') {
        const list = (mockDb.state[this.table] = mockDb.state[this.table] || [])
        const removedRows: any[] = []
        mockDb.state[this.table] = list.filter((row: any) => {
          const match = this.filters.every(f => f(row))
          if (match) {
            removedRows.push(row)
            return false
          }
          return true
        })
        await savePersistedState(this.table)
        return resolve({ data: removedRows, error: null, count: removedRows.length })
      }

      // SELECT operation
      let rows = [...(mockDb.state[this.table] || [])]

      for (const filter of this.filters) {
        rows = rows.filter(filter)
      }

      const totalCount = rows.length

      if (this.sortFn) {
        rows.sort(this.sortFn)
      }

      if (this.rangeStart !== null && this.rangeEnd !== null) {
        rows = rows.slice(this.rangeStart, this.rangeEnd + 1)
      } else if (this.limitCount !== null) {
        rows = rows.slice(0, this.limitCount)
      }

      rows = rows.map(r => this.enrichRelations(r))

      const result = {
        data: this.isHead ? null : (this.isSingle || this.isMaybeSingle ? (rows[0] ?? null) : rows),
        error: null,
        count: totalCount,
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
