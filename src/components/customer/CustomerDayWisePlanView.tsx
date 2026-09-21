'use client'

import { useState } from 'react'
import type { DayOfWeek, DayPlanData, GoalSummaryData, CurrentPlanMetaData } from '@/components/professional/StructuredDietEditor'
import { calcMealSubtotal, calcDayTotal } from '@/components/professional/StructuredDietEditor'

const DAYS_OF_WEEK: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

interface Props {
  activeVersionNumber: number
  effectiveFrom?: string
  changeReason?: string
  dayPlans?: Record<DayOfWeek, DayPlanData>
  goalSummary?: GoalSummaryData
  planMeta?: CurrentPlanMetaData
  otherItems?: any[]
  versions?: any[]
}

export default function CustomerDayWisePlanView({
  activeVersionNumber,
  effectiveFrom,
  changeReason,
  dayPlans,
  goalSummary,
  planMeta,
  otherItems = [],
  versions = [],
}: Props) {
  // Default active day to today's weekday if valid
  const getTodayDayOfWeek = (): DayOfWeek => {
    const d = new Date().getDay() // 0 = Sun, 1 = Mon ...
    const map: DayOfWeek[] = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ]
    return map[d] || 'Monday'
  }

  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(getTodayDayOfWeek())

  const currentDayPlan = dayPlans?.[selectedDay]
  const dayTotal = currentDayPlan ? calcDayTotal(currentDayPlan) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {/* 1. PLAN GOALS & CURRENT PLAN SUMMARY */}
      <div
        className="card"
        style={{
          padding: '18px 20px',
          background: 'linear-gradient(135deg, rgba(13,148,136,0.06) 0%, rgba(99,102,241,0.06) 100%)',
          border: '1px solid rgba(13,148,136,0.2)',
          borderRadius: 12,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="badge badge-success" style={{ fontWeight: 700 }}>
                v{activeVersionNumber} Active Regimen
              </span>
              <span className="text-caption text-muted">
                Prescribed by <strong>{planMeta?.doctor_name || 'Dr. Ananya Verma'}</strong>
              </span>
            </div>
            <h2 className="text-headline-sm" style={{ margin: '6px 0 0 0', fontWeight: 700, color: '#0f172a' }}>
              🎯 {goalSummary?.primary_goal || changeReason || 'Personalized Clinical Nutrition Plan'}
            </h2>
          </div>

          <div className="text-caption text-muted" style={{ textAlign: 'right' }}>
            Effective: <strong>{effectiveFrom ? new Date(effectiveFrom).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Today'}</strong>
            {planMeta?.plan_duration && <div>Duration: <strong>{planMeta.plan_duration}</strong></div>}
          </div>
        </div>

        {/* Goal Metric Badges */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginTop: 12 }}>
          {goalSummary?.current_weight_kg && (
            <div style={{ background: 'white', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <div className="text-caption text-muted" style={{ fontSize: 11, fontWeight: 600 }}>CURRENT WEIGHT</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>
                {goalSummary.current_weight_kg} kg
              </div>
            </div>
          )}

          {goalSummary?.target_weight_kg && (
            <div style={{ background: 'white', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <div className="text-caption text-muted" style={{ fontSize: 11, fontWeight: 600 }}>TARGET WEIGHT</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0d9488', marginTop: 2 }}>
                {goalSummary.target_weight_kg} kg
              </div>
            </div>
          )}

          <div style={{ background: 'white', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div className="text-caption text-muted" style={{ fontSize: 11, fontWeight: 600 }}>CALORIE TARGET</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0284c7', marginTop: 2 }}>
              {planMeta?.target_calories_kcal || 1450} kcal
            </div>
          </div>

          <div style={{ background: 'white', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div className="text-caption text-muted" style={{ fontSize: 11, fontWeight: 600 }}>WATER INTAKE</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#6366f1', marginTop: 2 }}>
              {planMeta?.water_intake_liters || 3.0} L/day
            </div>
          </div>
        </div>

        {goalSummary?.special_dietary_restrictions && (
          <div style={{ marginTop: 12, padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, color: '#991b1b', fontSize: 13 }}>
            ⛔ <strong>Dietary Restrictions:</strong> {goalSummary.special_dietary_restrictions}
          </div>
        )}
      </div>

      {/* 2. DAY-WISE SELECTOR */}
      {dayPlans && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h3 className="text-label-lg" style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>
              📅 Day-Wise Meal Plan
            </h3>
            <span className="text-caption text-muted">
              Select any day of the week
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 6,
              background: '#f1f5f9',
              padding: 6,
              borderRadius: 10,
            }}
          >
            {DAYS_OF_WEEK.map(day => {
              const isSelected = selectedDay === day
              const dTot = dayPlans[day] ? calcDayTotal(dayPlans[day]) : null

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  style={{
                    padding: '10px 4px',
                    borderRadius: 8,
                    border: isSelected ? '2px solid #0d9488' : '1px solid transparent',
                    background: isSelected ? '#ffffff' : 'transparent',
                    color: isSelected ? '#0d9488' : '#475569',
                    boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{day.slice(0, 3)}</div>
                  {dTot && (
                    <div style={{ fontSize: 11, color: isSelected ? '#0d9488' : '#64748b', marginTop: 2, fontWeight: 600 }}>
                      {dTot.energy} kcal
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* 3. DAILY TOTALS SUMMARY FOR SELECTED DAY */}
      {dayTotal && (
        <div
          style={{
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: 10,
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>⚡</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#065f46' }}>
                {selectedDay}&apos;s Daily Nutrition Summary
              </div>
              <div style={{ fontSize: 11, color: '#047857' }}>
                Breakfast + Lunch + Evening Snacks + Dinner
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#475569' }}>ENERGY</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{dayTotal.energy} kcal</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#475569' }}>CARBS</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0284c7' }}>{dayTotal.carbs}g</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#475569' }}>PROTEIN</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#16a34a' }}>{dayTotal.protein}g</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#475569' }}>FATS</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#d97706' }}>{dayTotal.fats}g</div>
            </div>
          </div>
        </div>
      )}

      {/* 4. MEAL SECTIONS WITH FOOD ITEM TABLES */}
      {currentDayPlan && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {(['breakfast', 'lunch', 'evening_snacks', 'dinner'] as const).map(mealKey => {
            const section = currentDayPlan.sections[mealKey]
            const subtotal = calcMealSubtotal(section.items)

            return (
              <div
                key={mealKey}
                style={{
                  border: '1px solid #cbd5e1',
                  borderRadius: 10,
                  overflow: 'hidden',
                  background: '#ffffff',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                }}
              >
                {/* Header */}
                <div
                  style={{
                    background: '#f8fafc',
                    padding: '10px 14px',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 20 }}>{section.icon}</span>
                    <h4 style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#0f172a' }}>
                      {section.title}
                    </h4>
                    {section.timing && (
                      <span className="badge badge-neutral" style={{ fontSize: 11, padding: '2px 8px' }}>
                        🕒 {section.timing}
                      </span>
                    )}
                  </div>

                  <span
                    style={{
                      background: '#f1f5f9',
                      padding: '3px 8px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#334155',
                    }}
                  >
                    Subtotal: <strong>{subtotal.energy} kcal</strong> • {subtotal.carbs}g C • {subtotal.protein}g P • {subtotal.fats}g F
                  </span>
                </div>

                {/* Table */}
                <div className="table-wrapper" style={{ margin: 0 }}>
                  <table style={{ margin: 0, width: '100%', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#fafafa', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ minWidth: 200 }}>Food Item</th>
                        <th style={{ width: 130 }}>Quantity</th>
                        <th style={{ width: 100 }}>Energy</th>
                        <th style={{ width: 90 }}>Carbs</th>
                        <th style={{ width: 90 }}>Protein</th>
                        <th style={{ width: 90 }}>Healthy Fats</th>
                      </tr>
                    </thead>
                    <tbody>
                      {section.items.map((it, idx) => (
                        <tr key={it.id || idx}>
                          <td style={{ fontWeight: 600, color: '#1e293b' }}>
                            {it.name}
                            {it.notes && (
                              <div className="text-caption text-muted" style={{ fontSize: 11, marginTop: 2 }}>
                                💡 {it.notes}
                              </div>
                            )}
                          </td>
                          <td className="text-muted">{it.quantity}</td>
                          <td style={{ fontWeight: 700, color: '#0f172a' }}>{it.energy_kcal} kcal</td>
                          <td style={{ color: '#0284c7' }}>{it.carbs_g}g</td>
                          <td style={{ color: '#16a34a' }}>{it.protein_g}g</td>
                          <td style={{ color: '#d97706' }}>{it.fats_g}g</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 5. DOCTOR RECOMMENDATIONS */}
      {planMeta?.doctor_instructions && (
        <div className="card" style={{ padding: '14px 16px', background: '#f8fafc', border: '1px solid #cbd5e1' }}>
          <h4 style={{ margin: '0 0 6px 0', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
            📝 Doctor&apos;s Recommendations &amp; Directives
          </h4>
          <p className="text-body-md" style={{ margin: 0, lineHeight: 1.5, color: '#334155' }}>
            {planMeta.doctor_instructions}
          </p>
        </div>
      )}

      {/* 6. OTHER MULTIDISCIPLINARY ITEMS (WORKOUT, YOGA, SLEEP) */}
      {otherItems.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {otherItems.map((item, idx) => (
            <div key={idx} className="card" style={{ padding: '12px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>
                  {item.category}
                </span>
              </div>
              <p className="text-body-md" style={{ margin: 0 }}>
                {item.instruction}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* 7. PLAN VERSION HISTORY */}
      {versions.length > 1 && (
        <div className="card" style={{ padding: 'var(--space-md)' }}>
          <h3 className="text-label-lg" style={{ marginBottom: 12 }}>Plan Revision History</h3>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Version</th>
                  <th>Effective Date</th>
                  <th>Status</th>
                  <th>Focus / Reason</th>
                </tr>
              </thead>
              <tbody>
                {versions.map(v => (
                  <tr key={v.id}>
                    <td><strong>v{v.version_number}</strong></td>
                    <td className="text-body-sm text-muted">
                      {v.effective_from ? new Date(v.effective_from).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td>
                      <span className={`badge badge-${v.status === 'published' ? 'success' : v.status === 'draft' ? 'warning' : 'neutral'}`} style={{ textTransform: 'capitalize' }}>
                        {v.status}
                      </span>
                    </td>
                    <td className="text-body-sm">{v.change_reason || 'Regular update'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
