import { NextRequest, NextResponse } from 'next/server'
// ⚠️ 時段規則一律走 computeAvailability，不要在這裡自己算一套。
//    這支曾經有自己的完整副本，而且每次規則變更都漏改：
//      · 2026-08-12 前停在「沒有 12:00/12:30」的舊時段表（8/06 午休改可自訂時漏改）
//      · 到 2026-08-14 為止仍不支援午休、不支援固定梯次、也不排除今天已過去的時段
//        → 自由島第一梯被訂走後，它會推薦 08:30 這種她根本不出船的時間。
//    改成共用同一套邏輯後，往後時段規則只要改 slots.ts 一處。
import { computeAvailability, taipeiDate } from '@/lib/slots'
import { getSheetData } from '@/lib/sheets'

// ⚠️ 不要用 `new Date(); setHours(0,0,0,0)` 算天數差 ——
//    那是「執行環境時區」的午夜，而 Vercel 跑在 UTC。
//    `dateStr + 'T12:00:00'`（無 Z）在 UTC 環境被當成 UTC 正午，
//    減掉 UTC 午夜只有 0.5 天，Math.round 進位成 1 → 今天被標成「明天」。
//    （2026-08-14 實測：Lia 回傳 date=2026-08-14 卻顯示「明天」）
//    比日期字串最安全，完全不做時間算術。
function dateLabel(dateStr: string): string {
  if (dateStr === taipeiDate(0)) return '今天'
  if (dateStr === taipeiDate(1)) return '明天'
  const d = new Date(dateStr + 'T12:00:00Z')
  const DOW = ['日','一','二','三','四','五','六']
  return `${d.getUTCMonth()+1}/${d.getUTCDate()}（周${DOW[d.getUTCDay()]}）`
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const providerId = searchParams.get('providerId')
  const serviceId  = searchParams.get('serviceId') ?? ''
  if (!providerId) return NextResponse.json({ error: 'Missing providerId' }, { status: 400 })

  const [bookingRows, serviceRows, availRows] = await Promise.all([
    getSheetData('bookings!A2:M', { provider_id: providerId }),
    getSheetData('services!A2:F', { provider_id: providerId }),
    getSheetData('availability!A2:I', { provider_id: providerId }),
  ])

  // offset 從 0 開始 —— 今天剩下的時段也該賣得掉。
  // （改用 computeAvailability 前這裡是 offset=1，早上九點打開會被推薦到明天）
  for (let offset = 0; offset <= 30; offset++) {
    const dateStr = taipeiDate(offset)
    const slots = computeAvailability({
      providerId, date: dateStr, serviceId, bookingRows, serviceRows, availRows,
    })
    const first = slots.find(s => s.status !== 'booked')
    if (first) {
      return NextResponse.json({ date: dateStr, time: first.time, label: dateLabel(dateStr) })
    }
  }

  return NextResponse.json({ date: null, time: null, label: null })
}
