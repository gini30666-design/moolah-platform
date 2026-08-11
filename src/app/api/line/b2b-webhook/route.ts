import { NextRequest, NextResponse } from 'next/server'
import { verifySignature, pushMessage } from '@/lib/line'
import { sb } from '@/lib/supabase'

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

/** 取得加好友者的個人資料（失敗不影響通知送出） */
async function getProfile(userId: string): Promise<{ displayName: string; pictureUrl: string }> {
  const empty = { displayName: '', pictureUrl: '' }
  const token = process.env.LINE_B2B_CHANNEL_ACCESS_TOKEN
  if (!token || !userId) return empty
  try {
    const res = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return empty
    const d = await res.json()
    return { displayName: d.displayName ?? '', pictureUrl: d.pictureUrl ?? '' }
  } catch {
    return empty
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

  // 名冊寫入絕不能拖累通知：DB 掛了也要讓 Gini 知道有人進來。
  // 所以每一處都獨立 try/catch，並把成敗回報在 response（不靜默失敗）。
  let saved = 0
  let saveFailed = 0
  const save = async (label: string, fn: () => Promise<{ error: unknown }>) => {
    try {
      const { error } = await fn()
      if (error) { saveFailed++; console.error(`[b2b-webhook] ${label} 寫入失敗`, error) }
      else saved++
    } catch (e) {
      saveFailed++
      console.error(`[b2b-webhook] ${label} 丟出例外`, e)
    }
  }

  for (const ev of events) {
    const userId = ev.source?.userId ?? ''

    // ── 有人加好友 → 存名冊 + 即時通知，這是這支 webhook 存在的主要理由 ──
    if (ev.type === 'follow') {
      const { displayName: name, pictureUrl } = await getProfile(userId)
      const now = new Date().toISOString()

      // 🔑 把 userId 存下來（2026-08-11）。
      // 以前只把暱稱印在通知裡、userId 直接丟掉 → 純加好友沒開口的人事後就再也聯絡不到，
      // 只剩「群發」一條路，而群發會打擾正在談的其他客戶。存了才能一對一 push。
      // upsert：同一人取消追蹤後再加回來 → 更新資料並清掉 unfollowed_at，不要變成兩筆。
      if (userId) {
        await save('follow', async () => await sb.from('b2b_followers').upsert({
          line_user_id: userId,
          display_name: name || null,
          picture_url: pictureUrl || null,
          followed_at: now,
          unfollowed_at: null,
        }, { onConflict: 'line_user_id' }))
      }

      await notify(
        `🎉 招商 OA 有新好友\n\n${name ? `暱稱：${name}\n` : ''}時間：${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}\n\n` +
        `⚠️ 對方還沒開口，你在聊天列表看不到他。\n已存進名冊，可請阿東直接私訊他（不用群發）。`,
      )
      continue
    }

    // ── 取消追蹤 → 只記錄不通知。有 unfollowed_at 的人 push 一定失敗，先標起來避免白打 ──
    if (ev.type === 'unfollow' && userId) {
      await save('unfollow', async () => await sb.from('b2b_followers')
        .update({ unfollowed_at: new Date().toISOString() })
        .eq('line_user_id', userId))
      continue
    }

    // ── 有人開口 → 記下第一次說話的時間 ──
    // 這個時間戳的用途：first_message_at 為 null 的人＝聊天列表看不到、需要主動敲的那群。
    //
    // ⚠️ 刻意「不」通知（2026-08-10 Gini 指示）：他手機裝了 LINE 官方帳號 App，
    //    對方一傳訊息就有原生推播，這裡再推一次只會把真正重要的 follow 通知淹掉。
    if (ev.type === 'message' && userId) {
      // 先確保名冊裡有這個人：本表 2026-08-11 才建立，在那之前加好友的人（熊、Tai…）沒有 follow 事件，
      // 直接 update 會match 0 筆、永遠不進名冊。ignoreDuplicates＝已存在就不動，不會蓋掉暱稱。
      await save('message_seen', async () => await sb.from('b2b_followers')
        .upsert({ line_user_id: userId }, { onConflict: 'line_user_id', ignoreDuplicates: true }))
      await save('first_message', async () => await sb.from('b2b_followers')
        .update({ first_message_at: new Date().toISOString() })
        .eq('line_user_id', userId)
        .is('first_message_at', null))   // 只記第一次，之後每則訊息不再覆寫
    }

    // 其他事件（join / postback…）都不處理，保持安靜
  }

  // notified/failed 讓「通知到底有沒有送出」可被驗證（簽章已擋住外人，無敏感資訊）
  // saved/saveFailed 同理——名冊沒存到卻回 200，等於未來又聯絡不到人，而且沒人會發現
  return NextResponse.json({ ok: true, notified, failed, saved, saveFailed })
}
