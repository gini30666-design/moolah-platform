import { NextRequest, NextResponse } from 'next/server'
import { getSheetData } from '@/lib/sheets'
import { sb } from '@/lib/supabase'
import { verifyOwner } from '@/lib/auth'

const DOW_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

// breakStart/breakEnd 留空＝該日不休息（2026-08-06 起午休改由職人自訂）
const DEFAULT_SCHEDULE = [
  { day: 0, startTime: '09:00', endTime: '19:00', isOpen: false, breakStart: '', breakEnd: '', slotStarts: '' },
  { day: 1, startTime: '09:00', endTime: '19:00', isOpen: true, breakStart: '12:00', breakEnd: '13:00', slotStarts: '' },
  { day: 2, startTime: '09:00', endTime: '19:00', isOpen: true, breakStart: '12:00', breakEnd: '13:00', slotStarts: '' },
  { day: 3, startTime: '09:00', endTime: '19:00', isOpen: true, breakStart: '12:00', breakEnd: '13:00', slotStarts: '' },
  { day: 4, startTime: '09:00', endTime: '19:00', isOpen: true, breakStart: '12:00', breakEnd: '13:00', slotStarts: '' },
  { day: 5, startTime: '09:00', endTime: '19:00', isOpen: true, breakStart: '12:00', breakEnd: '13:00', slotStarts: '' },
  { day: 6, startTime: '09:00', endTime: '17:00', isOpen: true, breakStart: '12:00', breakEnd: '13:00', slotStarts: '' },
]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const providerId = searchParams.get('providerId')
  if (!providerId) return NextResponse.json({ error: 'Missing providerId' }, { status: 400 })

  const auth = await verifyOwner(req, providerId)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const rows = await getSheetData('availability!A2:I')
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
      breakStart: found[6] ?? '',
      breakEnd: found[7] ?? '',
      slotStarts: found[8] ?? '',
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

  // 砍掉該職人所有舊排班/休假，重建。
  // ⚠️ 這是「先刪再寫」，兩步之間若失敗，職人的排班會整批消失
  //    （排班沒了＝客人看到整月都不能約，職人不會馬上發現）。
  //    Supabase JS SDK 無法跨語句開 transaction，所以改用兩道防線：
  //      1) delete 失敗就直接中止，不進到 insert
  //      2) insert 失敗就把舊資料寫回去（下方 catch）
  //    真正的原子性要移到 DB function，這裡先把「靜默清空」這個最壞情況堵掉。
  const { data: previous, error: readErr } = await sb
    .from('availability').select('*').eq('provider_id', providerId)
  if (readErr) {
    return NextResponse.json({ error: '讀取原排班失敗，未做任何變更' }, { status: 500 })
  }

  const { error: delErr } = await sb.from('availability').delete().eq('provider_id', providerId)
  if (delErr) {
    return NextResponse.json({ error: '清除舊排班失敗，未做任何變更' }, { status: 500 })
  }

  const rows: Record<string, unknown>[] = []
  for (const s of schedule ?? []) {
    // 午休：兩欄都要有值才寫入（只填一邊視同不休，避免半套設定讓 slots 判斷不成立）
    const hasBreak = !!s.breakStart && !!s.breakEnd
    // 固定梯次：正規化成 "HH:MM,HH:MM"（去空白、補前導零、丟掉非法值）。全空＝null＝每 30 分一格
    const slotStarts = String(s.slotStarts ?? '')
      .split(',').map((x: string) => x.trim())
      .map((x: string) => { const m = x.match(/^(\d{1,2}):(\d{2})$/); return m ? `${m[1].padStart(2, '0')}:${m[2]}` : '' })
      .filter(Boolean).sort().join(',')
    rows.push({
      provider_id: providerId, type: 'schedule', day_or_date: DOW_NAMES[s.day],
      start_time: s.startTime, end_time: s.endTime, active: !!s.isOpen,
      break_start: hasBreak ? s.breakStart : null,
      break_end: hasBreak ? s.breakEnd : null,
      slot_starts: slotStarts || null,
    })
  }
  for (const date of blockedDates ?? []) {
    rows.push({ provider_id: providerId, type: 'block', day_or_date: date, start_time: null, end_time: null, active: true })
  }
  if (rows.length) {
    const { error } = await sb.from('availability').insert(rows)
    if (error) {
      // 寫入失敗 → 把剛才刪掉的舊排班補回去，不要讓職人的班表憑空消失。
      // 還原本身若再失敗就只能記錄下來（監控會推播），但至少不是靜默的。
      if (previous?.length) {
        const { error: restoreErr } = await sb.from('availability').insert(previous)
        if (restoreErr) {
          console.error('[schedule] 新排班寫入失敗且舊排班還原也失敗', { providerId, restoreErr })
          return NextResponse.json(
            { error: '排班儲存失敗，且原排班未能還原，請立即重新設定一次排班' },
            { status: 500 },
          )
        }
      }
      return NextResponse.json({ error: '排班儲存失敗，已還原為原本的設定，請再試一次' }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}
