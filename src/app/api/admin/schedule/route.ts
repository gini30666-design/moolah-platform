import { NextRequest, NextResponse } from 'next/server'
import { getSheetData, appendRow, sheets, SHEET_ID } from '@/lib/sheets'

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

  const rows = await getSheetData('availability!A2:F')
  const providerRows = rows.filter(r => r[0] === providerId && r[1])
  const scheduleRows = providerRows.filter(r => r[1] === 'schedule')
  const blockRows = providerRows.filter(r => r[1] === 'block')

  const schedule = DEFAULT_SCHEDULE.map(def => {
    const found = scheduleRows.find(r => r[2] === String(def.day))
    if (!found) return def
    return {
      day: def.day,
      startTime: found[3] ?? '09:00',
      endTime: found[4] ?? '19:00',
      isOpen: found[5] === 'TRUE',
    }
  })

  const blockedDates = blockRows.map(r => r[2]).filter(Boolean).sort()

  return NextResponse.json({ schedule, blockedDates })
}

export async function PUT(req: NextRequest) {
  const { providerId, schedule, blockedDates } = await req.json()
  if (!providerId) return NextResponse.json({ error: 'Missing providerId' }, { status: 400 })

  const rows = await getSheetData('availability!A2:F')
  const indicesToClear: number[] = []
  rows.forEach((row, idx) => {
    if (row[0] === providerId) indicesToClear.push(idx + 2)
  })

  for (const rowIdx of indicesToClear) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `availability!A${rowIdx}:F${rowIdx}`,
      valueInputOption: 'RAW',
      requestBody: { values: [['', '', '', '', '', '']] },
    })
  }

  for (const s of schedule ?? []) {
    await appendRow('availability!A:F', [
      providerId, 'schedule', String(s.day), s.startTime, s.endTime, s.isOpen ? 'TRUE' : 'FALSE',
    ])
  }

  for (const date of blockedDates ?? []) {
    await appendRow('availability!A:F', [
      providerId, 'block', date, '', '', 'TRUE',
    ])
  }

  return NextResponse.json({ ok: true })
}
