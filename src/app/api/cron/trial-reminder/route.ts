import { NextRequest, NextResponse } from 'next/server'
import { getSheetData } from '@/lib/sheets'
import { pushMessage } from '@/lib/line'
import { TRIAL_BOOKING_LIMIT } from '@/lib/plan'

// 每日 09:00 (UTC+8 = 01:00 UTC) 由 Vercel Cron 觸發
// vercel.json: { "path": "/api/cron/trial-reminder", "schedule": "0 1 * * *" }
//
// 給「業務（Gini）」的每日試用追蹤待辦，推到 OPS_LINE_USER_ID：
//   ⏰ 3 天內到期 + 🔴 已到期未轉正（30 天內）
// 目的：業務主動聯絡客戶確認續用意願、聽取回饋。提醒對象是業務，不是設計師。

const TRIAL_LIMIT = TRIAL_BOOKING_LIMIT
const DAY = 86400000

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ops = process.env.OPS_LINE_USER_ID
  if (!ops) {
    return NextResponse.json({ skipped: 'OPS_LINE_USER_ID 未設定' })
  }

  const [providers, bookings] = await Promise.all([
    getSheetData('providers!A2:X'),
    getSheetData('bookings!A2:M'),
  ])

  const now = Date.now()
  const usedCount = (pid: string) =>
    bookings.filter(r => r[1] === pid && r[12] !== 'cancelled').length

  const soon: string[] = []      // 0 < 剩餘 <= 3 天
  const expired: string[] = []   // 已到期、30 天內、仍是 trial（未轉正）
  // 🔑 2026-08-20 新增：**已認領、但一筆預約都還沒有** ＝ 試用尚未起算。
  //    試用期改成「第一筆預約起算」之後，這群人不會到期，也就永遠不會出現在
  //    上面兩張名單裡 —— 但他們正是真正的瓶頸（工具給了，人沒動起來）。
  //    不追這群人，等於把最該處理的問題變成盲點。
  const notStarted: string[] = []

  for (const r of providers) {
    const plan = (r[21] ?? '').toString().trim().toLowerCase()
    if (plan !== 'trial') continue
    const end = r[23] ? new Date(r[23] as string).getTime() : 0
    const name = r[1] || r[0]
    const store = r[6] || ''
    const phone = r[10] || ''
    const ig = r[11] || ''
    const used = usedCount(r[0] as string)
    const endDate = new Date(end).toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei', month: 'numeric', day: 'numeric' })
    const contact = phone ? `📞${phone}` : (ig ? `IG @${ig}` : r[0])
    const base = `• ${name}${store ? ` / ${store}` : ''}｜已用 ${used}/${TRIAL_LIMIT} 筆｜${contact}`

    // 試用尚未起算（＝還沒有任何真實預約）
    if (!end) {
      const claimedAt = r[20] ? new Date(r[20] as string).getTime() : 0
      const days = claimedAt ? Math.floor((now - claimedAt) / DAY) : 0
      notStarted.push(`• ${name}${store ? ` / ${store}` : ''}｜認領 ${days} 天｜還沒有任何預約｜${contact}`)
      continue
    }

    const daysLeft = Math.ceil((end - now) / DAY)
    if (daysLeft > 0 && daysLeft <= 3) {
      soon.push(`${base}（剩 ${daysLeft} 天・${endDate} 到期）`)
    } else if (daysLeft <= 0 && daysLeft > -30) {
      expired.push(`${base}（已到期 ${-daysLeft} 天）`)
    }
  }

  if (soon.length === 0 && expired.length === 0 && notStarted.length === 0) {
    return NextResponse.json({ ok: true, soon: 0, expired: 0, notStarted: 0 })
  }

  let msg = '📋 MooLah 試用追蹤（業務待辦）\n'
  if (notStarted.length) msg += `\n🟠 還沒開始用（試用未起算）\n${notStarted.join('\n')}\n`
  if (soon.length) msg += `\n⏰ 即將到期（3 天內）\n${soon.join('\n')}\n`
  if (expired.length) msg += `\n🔴 已到期未轉正\n${expired.join('\n')}\n`
  msg += notStarted.length
    ? '\n👉 「還沒開始用」是現在最該處理的：幫他把預約連結放進接單動線（IG bio／老客群發／Google 商家／立牌），第一筆進來試用才會起算。'
    : '\n👉 主動聯絡：確認續用意願、聽取使用回饋；確定合作後再寄客製立牌並開立電子發票'

  await pushMessage(ops, msg)
  return NextResponse.json({ ok: true, soon: soon.length, expired: expired.length, notStarted: notStarted.length })
}
