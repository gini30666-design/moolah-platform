import { NextRequest, NextResponse } from 'next/server'
import { getSheetData } from '@/lib/sheets'
import { pushFlexMessage, monthlyStatementFlex } from '@/lib/line'

// 每月 1 號 09:00 (UTC+8 = 01:00 UTC) 由 Vercel Cron 觸發
// vercel.json: { "path": "/api/cron/monthly-statement", "schedule": "0 1 1 * *" }
//
// 對每位已綁定 LINE 的設計師：
// 1. 計算上月成交數、營收
// 2. LINE 推播：「📊 上月對帳單已產生」+ /statement/{providerId}/{YYYY-MM} 連結

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://moolah-platform.vercel.app'

function lastMonthYM(): string {
  // 以台北時區的「上個月」為基準
  const now = new Date(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date()) + 'T12:00:00+08:00')
  now.setMonth(now.getMonth() - 1)
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ym = lastMonthYM()
  const [year, monthStr] = ym.split('-')
  const monthNum = parseInt(monthStr)
  const lastDay = new Date(parseInt(year), monthNum, 0).getDate()
  const from = `${year}-${monthStr}-01`
  const to = `${year}-${monthStr}-${String(lastDay).padStart(2,'0')}`

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

    // 計算當月統計
    const monthBookings = bookingRows.filter(r =>
      r[1] === providerId && (r[5] as string) >= from && (r[5] as string) <= to
    )
    const valid = monthBookings.filter(r => (r[12] ?? '') !== 'cancelled' && (r[12] ?? '') !== 'no_show')
    const revenue = valid.reduce((sum, r) => {
      const svc = serviceRows.find(s => s[0] === providerId && s[1] === r[2])
      return sum + (svc ? Number(svc[3]) : 0)
    }, 0)

    const statementUrl = `${BASE_URL}/statement/${providerId}/${ym}`
    const displayName = storeName || providerName

    try {
      await pushFlexMessage(lineUserId, `${ym} 月度成績單`, monthlyStatementFlex({
        displayName,
        ym,
        deals: valid.length,
        revenue,
        statementUrl,
      }))
      sent++
    } catch (err) {
      errors.push(`${providerId}: ${(err as Error).message}`)
    }
  }

  return NextResponse.json({ ym, sent, skipped, errors })
}
