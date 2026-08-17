'use client'
import { useEffect, useState } from 'react'
import LineLink from '@/components/LineLink'
import { OA_CONSUMER } from '@/lib/lineOA'
import { todayInTaipei } from '@/lib/slots'

type DayStatus = 'open' | 'limited' | 'full' | 'closed'
type CalendarDay = { date: string; status: DayStatus }

const DOW_LABELS = ['日', '一', '二', '三', '四', '五', '六']

const STATUS_STYLE: Record<DayStatus, { dot: string; text: string; cursor: string }> = {
  open:    { dot: 'var(--oak)',                  text: 'var(--charcoal)',           cursor: 'pointer' },
  limited: { dot: 'rgba(var(--theme-accent-rgb-legacy),0.55)', text: 'var(--charcoal)', cursor: 'pointer' },
  full:    { dot: 'transparent',                 text: 'rgba(var(--theme-ink-rgb-legacy),0.38)', cursor: 'default' },
  closed:  { dot: 'transparent',                 text: 'rgba(var(--theme-ink-rgb-legacy),0.32)', cursor: 'default' },
}

function formatMonth(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  return `${d.getMonth() + 1}月`
}

interface Props {
  providerId: string
  selectedServiceId?: string | null
}

export function AvailabilityCalendar({ providerId, selectedServiceId }: Props) {
  const [days, setDays] = useState<CalendarDay[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/calendar?providerId=${providerId}&days=28`)
      .then(r => r.json())
      .then((data: CalendarDay[]) => { setDays(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [providerId])

  if (loading) return (
    <div style={{ padding: '20px 0', display: 'flex', justifyContent: 'center' }}>
      <div style={{
        width: '20px', height: '20px', borderRadius: '50%',
        border: '1.5px solid rgba(var(--theme-accent-rgb-legacy),0.2)',
        borderTop: '1.5px solid var(--oak)',
        animation: 'spin 0.9s linear infinite',
      }} />
    </div>
  )

  if (!days.length) return null

  const bookableDays = days.filter(d => d.status === 'open' || d.status === 'limited')
  if (bookableDays.length === 0) return (
    <section style={{ margin: '0 20px 24px' }}>
      <p style={{ fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--oak)', marginBottom: '12px' }}>可預約日期</p>
      <div style={{ background: 'var(--theme-field)', border: '1px solid var(--theme-border)', borderRadius: 'var(--theme-card-radius)', padding: '32px 20px', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: '18px', color: 'var(--theme-muted)', marginBottom: '8px' }}>近期已額滿</p>
        <p style={{ fontSize: '11px', color: 'var(--theme-muted)', lineHeight: 1.6 }}>目前未來 28 天皆已預約完畢<br />歡迎直接透過 LINE 詢問候補</p>
        <LineLink source="availability_1" oaId={OA_CONSUMER} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '16px', padding: '10px 20px', borderRadius: '99px', background: '#06C755', color: 'white', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
          聯絡候補
        </LineLink>
      </div>
    </section>
  )

  // ⚠️ 不要用 `new Date().toISOString().split('T')[0]` —— 那是 UTC 日期。
  //    台灣是 UTC+8，凌晨 0–8 點之間 UTC 還停在昨天 → 日曆的「今天」標記會落在昨天。
  //    （同一個坑 2026-08-08 在 my-bookings／calendar 修過，這支當時漏掉）
  const todayStr = todayInTaipei()

  // Pad the front of the grid to align weekday columns
  const firstDate = new Date(days[0].date + 'T12:00:00')
  const leadPad = firstDate.getDay() // 0=Sun

  // Group into weeks to show month label
  const cells: (CalendarDay | null)[] = [
    ...Array(leadPad).fill(null),
    ...days,
  ]

  // Detect month boundary rows
  function getMonthForRow(rowIdx: number): string | null {
    const firstCellIdx = rowIdx * 7
    for (let i = firstCellIdx; i < firstCellIdx + 7; i++) {
      if (cells[i]) return formatMonth(cells[i]!.date)
    }
    return null
  }

  const totalRows = Math.ceil(cells.length / 7)

  function handleDayClick(day: CalendarDay) {
    if (day.status === 'full' || day.status === 'closed') return
    const base = `/${providerId}/book?date=${day.date}`
    window.location.href = selectedServiceId ? `${base}&service=${selectedServiceId}` : base
  }

  return (
    <section style={{ margin: '0 20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <p style={{ fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--oak)' }}>
          可預約日期
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--theme-muted)' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--oak)', display: 'inline-block' }} />
            有空位
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--theme-muted)' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(var(--theme-accent-rgb-legacy),0.5)', display: 'inline-block' }} />
            少量
          </span>
        </div>
      </div>

      <div style={{
        background: 'var(--theme-field)',
        border: '1px solid var(--theme-border)',
        borderRadius: 'var(--theme-card-radius)',
        overflow: 'hidden',
        padding: '16px 14px 14px',
      }}>
        {/* Weekday headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '8px' }}>
          {DOW_LABELS.map(l => (
            <div key={l} style={{ textAlign: 'center', fontSize: '10px', color: 'var(--theme-muted)', letterSpacing: '0.08em', padding: '0 2px 6px', opacity: 0.78 }}>
              {l}
            </div>
          ))}
        </div>

        {/* Calendar rows */}
        {Array.from({ length: totalRows }, (_, row) => {
          const monthLabel = row === 0 || getMonthForRow(row) !== getMonthForRow(row - 1)
            ? getMonthForRow(row) : null

          return (
            <div key={row}>
              {monthLabel && row > 0 && (
                <div style={{ fontSize: '9px', color: 'var(--oak)', letterSpacing: '0.2em', textAlign: 'center', padding: '8px 0 4px', opacity: 0.6 }}>
                  ── {monthLabel} ──
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '4px' }}>
                {Array.from({ length: 7 }, (_, col) => {
                  const cellIdx = row * 7 + col
                  const cell = cells[cellIdx]
                  if (!cell) return <div key={col} />

                  const isToday = cell.date === todayStr
                  const style = STATUS_STYLE[cell.status]
                  const isPast = cell.date < todayStr

                  return (
                    <div
                      key={col}
                      onClick={() => !isPast && handleDayClick(cell)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 2px',
                        borderRadius: '8px',
                        cursor: isPast ? 'default' : style.cursor,
                        background: isToday ? 'rgba(var(--theme-accent-rgb-legacy),0.18)' : 'transparent',
                        opacity: isPast ? 0.3 : 1,
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => {
                        if (!isPast && (cell.status === 'open' || cell.status === 'limited'))
                          (e.currentTarget as HTMLElement).style.background = 'rgba(var(--theme-accent-rgb-legacy),0.2)'
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = isToday ? 'rgba(var(--theme-accent-rgb-legacy),0.18)' : 'transparent'
                      }}
                    >
                      <span style={{
                        fontSize: '13px',
                        fontWeight: isToday ? 600 : 400,
                        color: isToday ? 'var(--oak)' : isPast ? 'rgba(var(--theme-ink-rgb-legacy),0.32)' : style.text,
                        lineHeight: 1,
                      }}>
                        {new Date(cell.date + 'T12:00:00').getDate()}
                      </span>
                      {/* Status dot */}
                      {!isPast && (
                        <span style={{
                          width: '4px',
                          height: '4px',
                          borderRadius: '50%',
                          background: style.dot,
                          flexShrink: 0,
                        }} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        <p style={{ textAlign: 'center', fontSize: '10px', color: 'var(--theme-muted)', marginTop: '8px', letterSpacing: '0.06em', opacity: 0.78 }}>
          點擊日期直接跳轉預約
        </p>
      </div>
    </section>
  )
}
