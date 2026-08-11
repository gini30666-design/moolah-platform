'use client'
import { useState, useEffect } from 'react'
import { taipeiDate } from '@/lib/slots'
import { authHeader } from '@/lib/clientAuth'

// breakStart/breakEnd 皆為空字串＝該日不休息
type DaySchedule = { day: number; startTime: string; endTime: string; isOpen: boolean; breakStart: string; breakEnd: string }

const DAY_LABELS = ['週日', '週一', '週二', '週三', '週四', '週五', '週六']
const oak = '#A68966'
const charcoal = '#2C2825'
const cream = '#fbf9f4'
const border = 'rgba(166,137,102,0.15)'
const inputStyle: React.CSSProperties = {
  background: 'rgba(166,137,102,0.06)', border: '1px solid rgba(166,137,102,0.18)',
  borderRadius: '10px', padding: '0 12px', minHeight: '44px', fontSize: 'calc(13px * var(--fs, 1))', color: charcoal,
  outline: 'none', width: '84px',
}

export default function ScheduleView({ providerId }: { providerId: string }) {
  const [schedule, setSchedule] = useState<DaySchedule[]>([])
  const [blockedDates, setBlockedDates] = useState<string[]>([])
  const [newBlockDate, setNewBlockDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/schedule?providerId=${providerId}`, { headers: authHeader() })
      .then(r => r.json())
      .then(d => {
        setSchedule(d.schedule ?? [])
        setBlockedDates(d.blockedDates ?? [])
        setLoading(false)
      })
  }, [providerId])

  function toggleDay(day: number) {
    setSchedule(prev => prev.map(s => s.day === day ? { ...s, isOpen: !s.isOpen } : s))
  }

  function updateTime(day: number, field: 'startTime' | 'endTime' | 'breakStart' | 'breakEnd', value: string) {
    setSchedule(prev => prev.map(s => s.day === day ? { ...s, [field]: value } : s))
  }

  // 休息時間開關：關掉＝兩欄清空（後端視為不休）；打開＝帶入常見的 12:00–13:00
  function toggleBreak(day: number) {
    setSchedule(prev => prev.map(s => {
      if (s.day !== day) return s
      const on = !!s.breakStart && !!s.breakEnd
      return on ? { ...s, breakStart: '', breakEnd: '' } : { ...s, breakStart: '12:00', breakEnd: '13:00' }
    }))
  }

  function addBlockedDate() {
    if (!newBlockDate || blockedDates.includes(newBlockDate)) return
    setBlockedDates(prev => [...prev, newBlockDate].sort())
    setNewBlockDate('')
  }

  function removeBlockedDate(date: string) {
    setBlockedDates(prev => prev.filter(d => d !== date))
  }

  async function handleSave() {
    setSaving(true)
    setSaveError('')
    try {
      const res = await fetch('/api/admin/schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ providerId, schedule, blockedDates }),
      })
      if (!res.ok) throw new Error('save failed')
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setSaveError('儲存失敗，請確認網路後再試一次')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '48px 0' }}>
      <p style={{ fontSize: 'calc(12px * var(--fs, 1))', color: '#7d736b' }}>載入排班中...</p>
    </div>
  )

  return (
    <div style={{ padding: '16px 16px 48px' }}>

      {/* Weekly schedule */}
      <p style={{ fontSize: 'calc(10px * var(--fs, 1))', color: oak, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '14px' }}>每週排班</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '32px' }}>
        {schedule.map(s => (
          <div key={s.day} style={{
            background: s.isOpen ? 'rgba(251,249,244,0.9)' : 'rgba(166,137,102,0.04)',
            border: `1px solid ${s.isOpen ? 'rgba(166,137,102,0.2)' : 'rgba(166,137,102,0.08)'}`,
            borderRadius: '14px', padding: '12px 16px',
            transition: 'all 0.2s',
          }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: 'calc(13px * var(--fs, 1))', color: s.isOpen ? charcoal : '#7d736b', width: '36px', flexShrink: 0 }}>
              {DAY_LABELS[s.day]}
            </span>

            {/* Toggle — 開關本體 42x24 太小，外層補到 44px 可點區 */}
            <button
              onClick={() => toggleDay(s.day)}
              aria-label={`${DAY_LABELS[s.day]}${s.isOpen ? '休息' : '營業'}`}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0,
                padding: '10px 0', minHeight: '44px', display: 'flex', alignItems: 'center',
              }}
            >
              <span style={{
                width: '42px', height: '24px', borderRadius: '12px', display: 'block',
                background: s.isOpen ? oak : 'rgba(166,137,102,0.2)',
                position: 'relative', transition: 'background 0.2s',
              }}>
                <span style={{
                  position: 'absolute', top: '3px',
                  left: s.isOpen ? '21px' : '3px',
                  width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
                  transition: 'left 0.2s', display: 'block',
                }} />
              </span>
            </button>

            {s.isOpen ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
                <input type="time" value={s.startTime} onChange={e => updateTime(s.day, 'startTime', e.target.value)} style={inputStyle} />
                <span style={{ fontSize: 'calc(11px * var(--fs, 1))', color: '#7d736b' }}>至</span>
                <input type="time" value={s.endTime} onChange={e => updateTime(s.day, 'endTime', e.target.value)} style={inputStyle} />
              </div>
            ) : (
              <span style={{ fontSize: 'calc(11px * var(--fs, 1))', color: '#c8c0b8', marginLeft: 'auto' }}>休息日</span>
            )}
            </div>

            {/* 午休（每日可各自設定；關閉＝整天連續接客） */}
            {s.isOpen && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
                marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed rgba(166,137,102,0.18)',
              }}>
                <button
                  onClick={() => toggleBreak(s.day)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: '0 8px 0 0',
                    minHeight: '44px', display: 'inline-flex', alignItems: 'center',
                    fontSize: 'calc(12px * var(--fs, 1))', color: s.breakStart && s.breakEnd ? oak : '#7d736b',
                  }}
                >
                  {s.breakStart && s.breakEnd ? '☑' : '☐'} 中間休息
                </button>
                {s.breakStart && s.breakEnd ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
                    <input type="time" value={s.breakStart} onChange={e => updateTime(s.day, 'breakStart', e.target.value)} style={inputStyle} />
                    <span style={{ fontSize: 'calc(11px * var(--fs, 1))', color: '#7d736b' }}>至</span>
                    <input type="time" value={s.breakEnd} onChange={e => updateTime(s.day, 'breakEnd', e.target.value)} style={inputStyle} />
                  </div>
                ) : (
                  <span style={{ fontSize: 'calc(11px * var(--fs, 1))', color: '#c8c0b8', marginLeft: 'auto' }}>不休息・整天可預約</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Blocked dates */}
      <p style={{ fontSize: 'calc(10px * var(--fs, 1))', color: oak, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '14px' }}>特定休假日</p>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
        <input
          type="date"
          value={newBlockDate}
          onChange={e => setNewBlockDate(e.target.value)}
          min={taipeiDate(0)}   /* 台北時區：UTC 會讓凌晨時可以選到昨天 */
          style={{ ...inputStyle, width: 'auto', flex: 1 }}
        />
        <button onClick={addBlockedDate} disabled={!newBlockDate} style={{
          padding: '9px 16px', background: newBlockDate ? oak : 'rgba(166,137,102,0.2)',
          color: cream, border: 'none', borderRadius: '10px', fontSize: 'calc(12px * var(--fs, 1))', cursor: 'pointer',
        }}>新增</button>
      </div>

      {blockedDates.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '28px' }}>
          {blockedDates.map(date => (
            <div key={date} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'rgba(180,60,60,0.05)', border: '1px solid rgba(180,60,60,0.1)',
              borderRadius: '10px', padding: '10px 14px',
            }}>
              <span style={{ fontSize: 'calc(13px * var(--fs, 1))', color: charcoal }}>{date}</span>
              <button onClick={() => removeBlockedDate(date)} style={{
                fontSize: 'calc(18px * var(--fs, 1))', color: '#c8a0a0', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1,
              }}>×</button>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: 'calc(12px * var(--fs, 1))', color: '#c8c0b8', marginBottom: '28px' }}>尚未設定特定休假日</p>
      )}

      {/* Save */}
      {saveError && (
        <p style={{ fontSize: 'calc(12px * var(--fs, 1))', color: '#b45c5c', marginBottom: '10px', textAlign: 'center' }}>{saveError}</p>
      )}
      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          width: '100%', padding: '15px', borderRadius: '50px', border: 'none', cursor: 'pointer',
          background: saved ? 'rgba(100,160,100,0.85)' : oak,
          color: cream, fontSize: 'calc(14px * var(--fs, 1))', fontWeight: 500, transition: 'background 0.3s',
        }}
      >
        {saving ? '儲存中...' : saved ? '✓ 已儲存' : '儲存排班設定'}
      </button>
    </div>
  )
}
