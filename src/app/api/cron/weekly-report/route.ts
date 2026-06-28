import { NextRequest, NextResponse } from 'next/server'
import { getSheetData } from '@/lib/sheets'
import { pushFlexMessage, weeklyReportFlex, liffUrl } from '@/lib/line'

// 每週日 20:00 (UTC+8 = 12:00 UTC) 推播本週成績 + 下週展望給合作設計師
// vercel.json: { "path": "/api/cron/weekly-report", "schedule": "0 12 * * 0" }

function todayTW(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date())
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T12:00:00+08:00')
  d.setDate(d.getDate() + n)
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 觸發當日為週日，本週 = 過去 6 天 + 今天，下週 = 明天起 7 天
  const today = todayTW()
  const weekStart = addDays(today, -6)
  const weekEnd = today
  const nextWeekStart = addDays(today, 1)
  const nextWeekEnd = addDays(today, 7)

  const [providerRows, bookingRows, serviceRows] = await Promise.all([
    getSheetData('providers!A2:G'),
    getSheetData('bookings!A2:M'),
    getSheetData('services!A2:F'),
  ])

  let sent = 0
  let skipped = 0
  const errors: string[] = []

  for (const p of providerRows) {
    const providerId = p[0] as string
    const providerName = (p[1] as string) ?? ''
    const lineUserId = ((p[4] as string) ?? '').trim()
    const storeName = (p[6] as string) ?? ''

    if (!providerId || !lineUserId) {
      skipped++
      continue
    }

    // 本週統計
    const thisWeekAll = bookingRows.filter(r =>
      r[1] === providerId && r[5] >= weekStart && r[5] <= weekEnd
    )
    const thisWeekValid = thisWeekAll.filter(r => (r[12] ?? '') !== 'cancelled' && (r[12] ?? '') !== 'no_show')
    const noShows = thisWeekAll.filter(r => (r[12] as string) === 'no_show').length
    const revenue = thisWeekValid.reduce((sum, r) => {
      const svc = serviceRows.find(s => s[0] === providerId && s[1] === r[2])
      return sum + (svc ? Number(svc[3]) : 0)
    }, 0)

    // 下週展望
    const nextWeek = bookingRows.filter(r =>
      r[1] === providerId && r[5] >= nextWeekStart && r[5] <= nextWeekEnd && (r[12] ?? '') !== 'cancelled'
    )

    const displayName = storeName || providerName
    const tip = thisWeekValid.length === 0
      ? '本週還沒有預約，可以發 IG 推廣作品集喔！'
      : noShows >= 2
      ? `本週有 ${noShows} 位 no-show，可考慮提醒老客戶或調整提前提醒。`
      : thisWeekValid.length >= 10
      ? '本週超忙碌，記得照顧自己 💪'
      : '節奏穩定，繼續加油！'

    try {
      await pushFlexMessage(lineUserId, '📊 本週成績單', weeklyReportFlex({
        displayName,
        weekRange: `${weekStart.slice(5)} – ${weekEnd.slice(5)}`,
        deals: thisWeekValid.length,
        revenue,
        noShows,
        nextWeekCount: nextWeek.length,
        tip,
        adminUrl: liffUrl(`/${providerId}/admin`),
      }))
      sent++
    } catch (err) {
      errors.push(`${providerId}: ${(err as Error).message}`)
    }
  }

  return NextResponse.json({ week: `${weekStart}~${weekEnd}`, sent, skipped, errors })
}
