import { NextRequest, NextResponse } from 'next/server'
import { verifySignature, pushMessage } from '@/lib/line'

/**
 * 招商 OA（@492ejbwx）的 webhook。
 *
 * 🔑 這支「只監聽、不說話」——刻意不寫任何自動回覆。
 * 招商對話是 Gini 本人的專業，機器人插嘴只會壞事；
 * 而且 LINE 的計費規則是「好友傳訊息後一分鐘內人工回覆免費」，
 * 程式主動 push 反而要錢。
 *
 * 為什麼需要它（2026-08-09 建立）：
 * LINE 的機制是——**純加好友的人不會出現在 OA Manager 的聊天列表**，
 * 也無法被主動私訊。所以在這之前，廣告帶來的人就算成功加了好友，
 * Gini 也看不到、聯絡不到，等於斷線。
 * 現在 follow 事件會即時推播通知，讓他知道「有人進來了」。
 *
 * ⚠️ 與 /api/line/webhook（消費者 bot @881zhkla）是兩支不同的 channel，
 * secret 不同，不可共用。
 */

export const maxDuration = 15

type LineEvent = {
  type: string
  source?: { userId?: string }
  message?: { type: string; text?: string }
  timestamp?: number
}

const OPS = () => process.env.OPS_LINE_USER_ID

/** 取得加好友者的顯示名稱（失敗不影響通知送出） */
async function getDisplayName(userId: string): Promise<string> {
  const token = process.env.LINE_B2B_CHANNEL_ACCESS_TOKEN
  if (!token || !userId) return ''
  try {
    const res = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return ''
    const d = await res.json()
    return d.displayName ?? ''
  } catch {
    return ''
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('x-line-signature') ?? ''

  // fail-closed：驗不過一律 401（用 B2B channel 的 secret，不是消費者那支）
  if (!verifySignature(body, signature, 'LINE_B2B_CHANNEL_SECRET')) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
  }

  let events: LineEvent[] = []
  try {
    events = (JSON.parse(body).events ?? []) as LineEvent[]
  } catch {
    return NextResponse.json({ ok: true })   // 壞掉的 payload 不要讓 LINE 一直重送
  }

  const ops = OPS()

  // 通知送出的結果要回報，不能靜默失敗。
  // ⚠️ 這支 webhook 的唯一價值就是「通知」——推播沒送到卻回 200，
  // 等於整個機制形同虛設，而且沒有人會發現。
  // （2026-08-09：跟複製連結那個假 fallback 同一類錯誤，不再犯）
  let notified = 0
  let failed = 0
  const notify = async (text: string) => {
    if (!ops) { failed++; console.error('[b2b-webhook] OPS_LINE_USER_ID 未設定，通知無法送出'); return }
    try {
      const ok = await pushMessage(ops, text)
      if (ok) notified++
      else { failed++; console.error('[b2b-webhook] pushMessage 回報失敗') }
    } catch (e) {
      failed++
      console.error('[b2b-webhook] pushMessage 丟出例外', e)
    }
  }

  for (const ev of events) {
    const userId = ev.source?.userId ?? ''

    // ── 有人加好友 → 即時通知，這是這支 webhook 存在的主要理由 ──
    if (ev.type === 'follow') {
      const name = await getDisplayName(userId)
      await notify(
        `🎉 招商 OA 有新好友\n\n${name ? `暱稱：${name}\n` : ''}時間：${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}\n\n` +
        `⚠️ 對方還沒開口，你在聊天列表看不到他。\n可先主動打聲招呼，別等他先說話。`,
      )
      continue
    }

    // ── 有人傳訊息 → 也通知一聲，但「不代替你回覆」 ──
    if (ev.type === 'message') {
      const name = await getDisplayName(userId)
      const text = ev.message?.type === 'text' ? (ev.message.text ?? '') : `（${ev.message?.type ?? '非文字'}訊息）`
      await notify(
        `💬 招商 OA 新訊息\n\n${name ? `${name}：` : ''}${text.slice(0, 120)}\n\n` +
        `👉 一分鐘內回覆不計訊息費，快去 LINE 後台回他。`,
      )
      continue
    }

    // 其他事件（unfollow / join…）目前不處理，保持安靜
  }

  // notified/failed 讓「通知到底有沒有送出」可被驗證（簽章已擋住外人，無敏感資訊）
  return NextResponse.json({ ok: true, notified, failed })
}
