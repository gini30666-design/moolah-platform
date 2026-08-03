import { getSheetData, appendRow } from '@/lib/sheets'
import { pushMessage } from '@/lib/line'
import { isSameCustomer, normalizePhone } from '@/lib/customerIdentity'

const NO_SHOW_THRESHOLD = 3

/**
 * 計算某客人對某設計師的 no_show 次數
 * 比對優先：lineUserId > customerName
 */
export async function countNoShows(
  providerId: string,
  customerLineUserId: string,
  customerName: string,
  customerPhone?: string,
): Promise<number> {
  // bookings 欄位：3=姓名 4=lineUserId 11=電話 12=status
  const rows = await getSheetData('bookings!A2:M', { provider_id: providerId })
  const me = { lineUserId: customerLineUserId, name: customerName, phone: customerPhone }

  return rows.filter(r => {
    if (r[1] !== providerId) return false
    if ((r[12] as string) !== 'no_show') return false
    return isSameCustomer(me, { lineUserId: r[4] as string, name: r[3] as string, phone: r[11] as string })
  }).length
}

/**
 * 檢查是否已在黑名單
 */
async function isAlreadyBlacklisted(
  providerId: string,
  customerLineUserId: string,
  customerName: string,
  customerPhone?: string,
): Promise<boolean> {
  try {
    const rows = await getSheetData('blacklist!A2:G', { provider_id: providerId })
    const me = { lineUserId: customerLineUserId, name: customerName, phone: customerPhone }
    return rows.some(r => {
      if (r[0] !== providerId) return false
      return isSameCustomer(me, { lineUserId: r[1] as string, name: r[2] as string, phone: r[6] as string })
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
  customerPhone?: string
}): Promise<{ triggered: boolean; reason?: string }> {
  const { providerId, providerLineUserId, providerName, customerLineUserId, customerName, customerPhone } = params

  try {
    const count = await countNoShows(providerId, customerLineUserId, customerName, customerPhone)
    if (count < NO_SHOW_THRESHOLD) return { triggered: false }

    const already = await isAlreadyBlacklisted(providerId, customerLineUserId, customerName, customerPhone)
    if (already) return { triggered: false, reason: 'already-blacklisted' }

    const reason = `系統自動加入：no-show 累計 ${count} 次`
    await appendRow('blacklist!A:G', [
      providerId,
      customerLineUserId ?? '',
      customerName ?? '',
      reason,
      new Date().toISOString(),
      'auto',
      normalizePhone(customerPhone),   // ← 真正擋得住 web 訪客的那一欄
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
