'use client'
import { useState, useEffect } from 'react'

type DaySchedule = { day: number; startTime: string; endTime: string; isOpen: boolean }

const DAY_LABELS = ['週日', '週一', '週二', '週三', '週四', '週五', '週六']
const oak = '#A68966'
const charcoal = '#2C2825'
const cream = '#fbf9f4'
const border = 'rgba(166,137,102,0.15)'
const inputStyle: React.CSSProperties = {
  background: 'rgba(166,137,102,0.06)', border: '1px solid rgba(166,137,102,0.18)',
  borderRadius: '10px', padding: '9px 12px', fontSize: '13px', color: charcoal,
  outline: 'none', width: '80px',
}

export default function ScheduleView({ providerId }: { providerId: string }) {
  const [schedule, setSchedule] = useState<DaySchedule[]>([])
  const [blockedDates, setBlockedDates] = useState<string[]>([])
  const [newBlockDate, setNewBlockDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/schedule?providerId=${providerId}`)
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

  function updateTime(day: number, field: 'startTime' | 'endTime', value: string) {
    setSchedule(prev => prev.map(s => s.day === day ? { ...s, [field]: value } : s))
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
    await fetch('/api/admin/schedule', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providerId, schedule, blockedDates }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '48px 0' }}>
      <p style={{ fontSize: '12px', color: '#b0a89e' }}>載入排班中...</p>
    </div>
  )

  return (
    <div style={{ padding: '16px 16px 48px' }}>

      {/* Weekly schedule */}
      <p style={{ fontSize: '10px', color: oak, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '14px' }}>每週排班</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '32px' }}>
        {schedule.map(s => (
          <div key={s.day} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            background: s.isOpen ? 'rgba(251,249,244,0.9)' : 'rgba(166,137,102,0.04)',
            border: `1px solid ${s.isOpen ? 'rgba(166,137,102,0.2)' : 'rgba(166,137,102,0.08)'}`,
            borderRadius: '14px', padding: '12px 16px',
            transition: 'all 0.2s',
          }}>
            <span style={{ fontSize: '13px', color: s.isOpen ? charcoal : '#b0a89e', width: '36px', flexShrink: 0 }}>
              {DAY_LABELS[s.day]}
            </span>

            {/* Toggle */}
            <button
              onClick={() => toggleDay(s.day)}
              style={{
                width: '42px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                background: s.isOpen ? oak : 'rgba(166,137,102,0.2)',
                position: 'relative', transition: 'background 0.2s', flexShrink: 0,
              }}
            >
              <span style={{
                position: 'absolute', top: '3px',
                left: s.isOpen ? '21px' : '3px',
                width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
                transition: 'left 0.2s',
              }} />
            </button>

            {s.isOpen ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
                <input type="time" value={s.startTime} onChange={e => updateTime(s.day, 'startTime', e.target.value)} style={inputStyle} />
                <span style={{ fontSize: '11px', color: '#b0a89e' }}>至</span>
                <input type="time" value={s.endTime} onChange={e => updateTime(s.day, 'endTime', e.target.value)} style={inputStyle} />
              </div>
            ) : (
              <span style={{ fontSize: '11px', color: '#c8c0b8', marginLeft: 'auto' }}>休息日</span>
            )}
          </div>
        ))}
      </div>

      {/* Blocked dates */}
      <p style={{ fontSize: '10px', color: oak, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '14px' }}>特定休假日</p>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
        <input
          type="date"
          value={newBlockDate}
          onChange={e => setNewBlockDate(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          style={{ ...inputStyle, width: 'auto', flex: 1 }}
        />
        <button onClick={addBlockedDate} disabled={!newBlockDate} style={{
          padding: '9px 16px', background: newBlockDate ? oak : 'rgba(166,137,102,0.2)',
          color: cream, border: 'none', borderRadius: '10px', fontSize: '12px', cursor: 'pointer',
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
              <span style={{ fontSize: '13px', color: charcoal }}>{date}</span>
              <button onClick={() => removeBlockedDate(date)} style={{
                fontSize: '18px', color: '#c8a0a0', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1,
              }}>×</button>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: '12px', color: '#c8c0b8', marginBottom: '28px' }}>尚未設定特定休假日</p>
      )}

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          width: '100%', padding: '15px', borderRadius: '50px', border: 'none', cursor: 'pointer',
          background: saved ? 'rgba(100,160,100,0.85)' : oak,
          color: cream, fontSize: '14px', fontWeight: 500, transition: 'background 0.3s',
        }}
      >
        {saving ? '儲存中...' : saved ? '✓ 已儲存' : '儲存排班設定'}
      </button>
    </div>
  )
}
