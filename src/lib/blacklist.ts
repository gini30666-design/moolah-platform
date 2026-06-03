import { getSheetData, appendRow } from '@/lib/sheets'
import { pushMessage } from '@/lib/line'

const NO_SHOW_THRESHOLD = 3

const norm = (s: string) => (s ?? '').replace(/\s+/g, '').toLowerCase()

/**
 * 計算某客人對某設計師的 no_show 次數
 * 比對優先：lineUserId > customerName
 */
export async function countNoShows(
  providerId: string,
  customerLineUserId: string,
  customerName: string,
): Promise<number> {
  const rows = await getSheetData('bookings!A2:M')
  const needle = norm(customerName)

  return rows.filter(r => {
    if (r[1] !== providerId) return false
    if ((r[12] as string) !== 'no_show') return false
    const matchById = customerLineUserId && r[4] && r[4] === customerLineUserId
    const matchByName = customerName && r[3] && norm(r[3] as string) === needle
    return matchById || matchByName
  }).length
}

/**
 * 檢查是否已在黑名單
 */
async function isAlreadyBlacklisted(
  providerId: string,
  customerLineUserId: string,
  customerName: string,
): Promise<boolean> {
  try {
    const rows = await getSheetData('blacklist!A2:E')
    const needle = norm(customerName)
    return rows.some(r => {
      if (r[0] !== providerId) return false
      const matchById = customerLineUserId && r[1] && r[1] === customerLineUserId
      const matchByName = customerName && r[2] && norm(r[2] as string) === needle
      return matchById || matchByName
    })
  } catch {
    return false
  }
}

/**
 * 每次標記 no_show 後呼叫：若達 3 次，自動加入黑名單 + 推播通知設計師
 * 失敗不會 throw（log 後返回 false），絕不影響原本的 no_show 標記流程。
 */
export async function autoBlacklistIfThresholdReached(params: {
  providerId: string
  providerLineUserId?: string
  providerName?: string
  customerLineUserId: string
  customerName: string
}): Promise<{ triggered: boolean; reason?: string }> {
  const { providerId, providerLineUserId, providerName, customerLineUserId, customerName } = params

  try {
    const count = await countNoShows(providerId, customerLineUserId, customerName)
    if (count < NO_SHOW_THRESHOLD) return { triggered: false }

    const already = await isAlreadyBlacklisted(providerId, customerLineUserId, customerName)
    if (already) return { triggered: false, reason: 'already-blacklisted' }

    const reason = `系統自動加入：no-show 累計 ${count} 次`
    await appendRow('blacklist!A:F', [
      providerId,
      customerLineUserId ?? '',
      customerName ?? '',
      reason,
      new Date().toISOString(),
      'auto',
    ])

    if (providerLineUserId) {
      const tag = providerName ? `${providerName} 您好，\n` : ''
      await pushMessage(
        providerLineUserId,
        `${tag}🚫 系統自動加入黑名單\n\n客人：${customerName}\n原因：no-show 累計 ${count} 次\n\n該客戶無法再預約您的服務。如要解除，傳「解封 @${customerName}」即可。`,
      )
    }

    return { triggered: true, reason }
  } catch (err) {
    console.error('[auto-blacklist error]', err)
    return { triggered: false, reason: 'error' }
  }
}
