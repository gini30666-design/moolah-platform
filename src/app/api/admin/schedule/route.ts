import { NextRequest, NextResponse } from 'next/server'
import { getSheetData } from '@/lib/sheets'
import { sb } from '@/lib/supabase'
import { verifyOwner } from '@/lib/auth'

const DOW_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

const DEFAULT_SCHEDULE = [
  { day: 0, startTime: '09:00', endTime: '19:00', isOpen: false },
  { day: 1, startTime: '09:00', endTime: '19:00', isOpen: true },
  { day: 2, startTime: '09:00', endTime: '19:00', isOpen: true },
  { day: 3, startTime: '09:00', endTime: '19:00', isOpen: true },
  { day: 4, startTime: '09:00', endTime: '19:00', isOpen: true },
  { day: 5, startTime: '09:00', endTime: '19:00', isOpen: true },
  { day: 6, startTime: '09:00', endTime: '17:00', isOpen: true },
]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const providerId = searchParams.get('providerId')
  if (!providerId) return NextResponse.json({ error: 'Missing providerId' }, { status: 400 })

  const auth = await verifyOwner(req, providerId)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const rows = await getSheetData('availability!A2:F')
  const providerRows = rows.filter(r => r[0] === providerId && r[1])
  const scheduleRows = providerRows.filter(r => r[1] === 'schedule')
  const blockRows = providerRows.filter(r => r[1] === 'block')

  const schedule = DEFAULT_SCHEDULE.map(def => {
    const found = scheduleRows.find(r => r[2] === DOW_NAMES[def.day])
    if (!found) return def
    return {
      day: def.day,
      startTime: found[3] ?? '09:00',
      endTime: found[4] ?? '19:00',
      isOpen: found[5]?.toUpperCase() === 'TRUE',
    }
  })

  const blockedDates = blockRows.map(r => r[2]).filter(Boolean).sort()

  return NextResponse.json({ schedule, blockedDates })
}

export async function PUT(req: NextRequest) {
  const { providerId, schedule, blockedDates } = await req.json()
  if (!providerId) return NextResponse.json({ error: 'Missing providerId' }, { status: 400 })

  const auth = await verifyOwner(req, providerId)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  // 砍掉該職人所有舊排班/休假，重建（取代舊「清空+append」）
  await sb.from('availability').delete().eq('provider_id', providerId)

  const rows: Record<string, unknown>[] = []
  for (const s of schedule ?? []) {
    rows.push({ provider_id: providerId, type: 'schedule', day_or_date: DOW_NAMES[s.day], start_time: s.startTime, end_time: s.endTime, active: !!s.isOpen })
  }
  for (const date of blockedDates ?? []) {
    rows.push({ provider_id: providerId, type: 'block', day_or_date: date, start_time: null, end_time: null, active: true })
  }
  if (rows.length) {
    const { error } = await sb.from('availability').insert(rows)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
