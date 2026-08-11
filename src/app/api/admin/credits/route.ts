import { NextRequest, NextResponse } from 'next/server'
import { sb } from '@/lib/supabase'
import { verifyOwner } from '@/lib/auth'
import { normalizePhone, isSameCustomer } from '@/lib/customerIdentity'
import { pushFlexMessage, creditLedgerFlex, liffUrl } from '@/lib/line'
import {
  computeBalance, canRedeem, isCardExpired, formatCredit,
  exceedsDiscountCap, needsWrittenContract, needsPerformanceGuarantee,
  REDEEM_REASON_TEXT, LEGAL, type CreditKind,
} from '@/lib/credits'

/**
 * 儲值卡／次卡 — 職人後台 API。
 *
 * ⚠️ MooLah 不經手任何金錢。錢由職人在線下自己收，這支只負責記帳。
 *    （理由與法規依據見 src/lib/credits.ts 檔頭）
 *
 * ⚠️ credit_ledger 有 DB trigger 擋 UPDATE/DELETE。要更正只能新增 entry_type='reverse'。
 *    不要嘗試改既有列——會直接噴 DB 例外。
 */

export const maxDuration = 20

type LedgerRow = {
  id: number; entry_type: string; delta: string | number; paid: string | number
  bonus: string | number; memo: string | null; service_name: string | null
  booking_id: string | null; reversal_of: number | null; created_at: string
}

/** 一次撈完某職人某客人的所有卡＋流水帳，餘額一律現算 */
async function loadCards(providerId: string, ident: { lineUserId?: string; phone?: string }) {
  const { data: cards, error } = await sb
    .from('customer_credits')
    .select('*')
    .eq('provider_id', providerId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)

  // 用 isSameCustomer 比對（LINE ID > 電話 > 姓名），與黑名單/備註同一套識別規則
  const mine = (cards ?? []).filter(c =>
    isSameCustomer(ident, { lineUserId: c.customer_line_user_id, phone: c.customer_phone, name: c.customer_name }))
  if (mine.length === 0) return []

  const { data: entries } = await sb
    .from('credit_ledger')
    .select('id, credit_id, entry_type, delta, paid, bonus, memo, service_name, booking_id, reversal_of, created_at')
    .in('credit_id', mine.map(c => c.id))
    .order('created_at', { ascending: false })

  return mine.map(c => {
    const rows = ((entries ?? []) as (LedgerRow & { credit_id: number })[]).filter(e => e.credit_id === c.id)
    const balance = computeBalance(rows)
    return {
      id: c.id,
      kind: c.kind as CreditKind,
      title: c.title,
      status: c.status,
      expiresOn: c.expires_on,
      refundTerms: c.refund_terms,
      agreedAt: c.agreed_at,
      note: c.note,
      createdAt: c.created_at,
      balance,
      balanceText: formatCredit(c.kind as CreditKind, balance),
      expired: isCardExpired(c.expires_on),
      needsGuarantee: needsPerformanceGuarantee(balance, c.kind as CreditKind),
      entries: rows.map(e => ({
        id: e.id, type: e.entry_type, delta: Number(e.delta), paid: Number(e.paid),
        bonus: Number(e.bonus), memo: e.memo, serviceName: e.service_name,
        reversalOf: e.reversal_of, createdAt: e.created_at,
      })),
    }
  })
}

/** 異動後通知客人。送不到不影響記帳（錢已經在線下換手了），但要 log。 */
async function notifyCustomer(params: {
  lineUserId?: string | null; providerId: string; providerName: string
  kind: CreditKind; title: string; headline: string; delta: number; balance: number
  expiresOn?: string | null; memo?: string
}) {
  const { lineUserId, providerId, providerName, kind, title, headline, delta, balance, expiresOn, memo } = params
  if (!lineUserId) return false
  const sign = delta >= 0 ? '+' : '−'
  const changeText = `${sign}${formatCredit(kind, Math.abs(delta))}`
  try {
    return await pushFlexMessage(lineUserId, `${headline}：${changeText}`, creditLedgerFlex({
      providerName, title, headline, changeText,
      balanceText: formatCredit(kind, balance),
      expiresOn, memo, viewUrl: liffUrl(`/${providerId}/credits`),
    }))
  } catch (e) {
    console.error('[credits] 通知客人失敗', e)
    return false
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const providerId = searchParams.get('providerId')
  const customerLineUserId = searchParams.get('customerLineUserId') ?? undefined
  const customerPhone = searchParams.get('customerPhone') ?? undefined

  const auth = await verifyOwner(req, providerId)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!customerLineUserId && !customerPhone) return NextResponse.json({ cards: [] })

  try {
    const cards = await loadCards(providerId!, { lineUserId: customerLineUserId, phone: customerPhone })
    return NextResponse.json({ cards, legal: LEGAL })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }

  const providerId = String(body.providerId ?? '')
  const action = String(body.action ?? '')

  const auth = await verifyOwner(req, providerId)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  // 職人名稱（通知卡用）
  const { data: prov } = await sb.from('providers').select('name').eq('id', providerId).maybeSingle()
  const providerName = prov?.name ?? ''

  try {
    // ── 建卡（可同時帶第一筆儲值）──
    if (action === 'create') {
      const kind = body.kind === 'count' ? 'count' : 'amount'
      const title = String(body.title ?? '').trim()
      if (!title) return NextResponse.json({ error: '請填卡片名稱' }, { status: 400 })

      const phone = normalizePhone(String(body.customerPhone ?? ''))
      const lineUserId = String(body.customerLineUserId ?? '') || null
      if (!phone && !lineUserId) return NextResponse.json({ error: '缺少客人識別（電話或 LINE）' }, { status: 400 })

      const { data: card, error } = await sb.from('customer_credits').insert({
        provider_id: providerId,
        customer_line_user_id: lineUserId,
        customer_phone: phone || null,
        customer_name: String(body.customerName ?? '') || null,
        kind,
        title,
        expires_on: body.expiresOn ? String(body.expiresOn) : null,
        refund_terms: body.refundTerms ? String(body.refundTerms) : null,
        // 客人當面確認過條款才給時間戳（存證用，對應法規的審閱與同意）
        agreed_at: body.agreed ? new Date().toISOString() : null,
        note: body.note ? String(body.note) : null,
      }).select('id').single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      const initial = Number(body.initialDelta ?? 0)
      const paid = Number(body.paid ?? 0)
      const bonus = Number(body.bonus ?? 0)
      if (initial > 0) {
        const { error: le } = await sb.from('credit_ledger').insert({
          credit_id: card.id, provider_id: providerId, entry_type: 'topup',
          delta: initial, paid, bonus, memo: body.memo ? String(body.memo) : null,
          created_by: auth.userId,
        })
        if (le) return NextResponse.json({ error: le.message }, { status: 500 })

        await notifyCustomer({
          lineUserId, providerId, providerName, kind: kind as CreditKind, title,
          headline: '已為您建立', delta: initial, balance: initial,
          expiresOn: body.expiresOn ? String(body.expiresOn) : null,
          memo: body.memo ? String(body.memo) : undefined,
        })
      }

      return NextResponse.json({
        ok: true, id: card.id,
        // 提醒不是阻擋——法規義務在職人身上，我們只負責讓他看得見
        warnings: buildWarnings({ kind, paid, bonus, balance: initial }),
      })
    }

    // ── 以下動作都需要 creditId，且要先確認這張卡屬於這位職人 ──
    const creditId = Number(body.creditId ?? 0)
    if (!creditId) return NextResponse.json({ error: 'missing_creditId' }, { status: 400 })

    const { data: card } = await sb.from('customer_credits')
      .select('*').eq('id', creditId).maybeSingle()
    if (!card) return NextResponse.json({ error: 'card_not_found' }, { status: 404 })
    // 🔑 反查驗證：不能讓 A 職人拿到 B 職人客人的卡號就能扣款
    if (card.provider_id !== providerId) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

    const { data: entries } = await sb.from('credit_ledger')
      .select('id, delta, entry_type').eq('credit_id', creditId)
    const balance = computeBalance((entries ?? []) as LedgerRow[])
    const kind = card.kind as CreditKind

    if (action === 'topup') {
      const delta = Number(body.delta ?? 0)
      if (!(delta > 0)) return NextResponse.json({ error: '儲值金額必須大於 0' }, { status: 400 })
      const paid = Number(body.paid ?? 0)
      const bonus = Number(body.bonus ?? 0)

      const { error } = await sb.from('credit_ledger').insert({
        credit_id: creditId, provider_id: providerId, entry_type: 'topup',
        delta, paid, bonus, memo: body.memo ? String(body.memo) : null, created_by: auth.userId,
      })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      const after = balance + delta
      await notifyCustomer({
        lineUserId: card.customer_line_user_id, providerId, providerName, kind, title: card.title,
        headline: '已儲值', delta, balance: after, expiresOn: card.expires_on,
        memo: body.memo ? String(body.memo) : undefined,
      })
      return NextResponse.json({ ok: true, balance: after, warnings: buildWarnings({ kind, paid, bonus, balance: after }) })
    }

    if (action === 'redeem') {
      const amount = Number(body.amount ?? 0)
      const check = canRedeem({ card: { kind, status: card.status, expires_on: card.expires_on }, balance, amount })
      if (!check.ok) {
        return NextResponse.json({ error: REDEEM_REASON_TEXT[check.reason], reason: check.reason, balance }, { status: 400 })
      }

      const { error } = await sb.from('credit_ledger').insert({
        credit_id: creditId, provider_id: providerId, entry_type: 'redeem',
        delta: -amount,
        // paid/bonus 是 NOT NULL DEFAULT 0：單筆 insert 省略沒事，但只要哪天改成批次寫入，
        // PostgREST 會用所有列的鍵集合聯集，缺的欄位塞 NULL 而不是套 DEFAULT → 直接違反約束。
        // 一律明寫，別留這種地雷。（2026-08-11 端到端測試踩到）
        paid: 0, bonus: 0,
        booking_id: body.bookingId ? String(body.bookingId) : null,
        service_name: body.serviceName ? String(body.serviceName) : null,
        memo: body.memo ? String(body.memo) : null, created_by: auth.userId,
      })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      const after = balance - amount
      await notifyCustomer({
        lineUserId: card.customer_line_user_id, providerId, providerName, kind, title: card.title,
        headline: '已扣款', delta: -amount, balance: after, expiresOn: card.expires_on,
        memo: body.serviceName ? String(body.serviceName) : (body.memo ? String(body.memo) : undefined),
      })
      return NextResponse.json({ ok: true, balance: after, warnings: buildWarnings({ kind, paid: 0, bonus: 0, balance: after }) })
    }

    // ── 沖正：唯一的「更正」方式。原紀錄永遠留著，新增一筆反向的並指回去 ──
    if (action === 'reverse') {
      const targetId = Number(body.ledgerId ?? 0)
      const target = ((entries ?? []) as LedgerRow[]).find(e => e.id === targetId)
      if (!target) return NextResponse.json({ error: 'entry_not_found' }, { status: 404 })
      if (target.entry_type === 'reverse') return NextResponse.json({ error: '沖正紀錄不能再沖正' }, { status: 400 })

      const { data: dup } = await sb.from('credit_ledger').select('id').eq('reversal_of', targetId).maybeSingle()
      if (dup) return NextResponse.json({ error: '這筆已經沖正過了' }, { status: 400 })

      const delta = -Number(target.delta)
      const { error } = await sb.from('credit_ledger').insert({
        credit_id: creditId, provider_id: providerId, entry_type: 'reverse',
        delta, paid: 0, bonus: 0, reversal_of: targetId,
        memo: body.memo ? String(body.memo) : '更正前一筆紀錄', created_by: auth.userId,
      })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      const after = balance + delta
      await notifyCustomer({
        lineUserId: card.customer_line_user_id, providerId, providerName, kind, title: card.title,
        headline: '已更正', delta, balance: after, expiresOn: card.expires_on,
        memo: body.memo ? String(body.memo) : '店家更正前一筆紀錄',
      })
      return NextResponse.json({ ok: true, balance: after })
    }

    if (action === 'close') {
      const { error } = await sb.from('customer_credits')
        .update({ status: body.reopen ? 'active' : 'closed' }).eq('id', creditId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'unknown_action' }, { status: 400 })
  } catch (e) {
    console.error('[credits POST]', e)
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

/**
 * 法規提醒。刻意做成「提醒」而非「阻擋」——
 * 這些義務在職人身上（他自己是預收款的收受者），我們的角色是讓他看得見，不是替他決定。
 */
function buildWarnings(p: { kind: CreditKind; paid: number; bonus: number; balance: number }): string[] {
  const out: string[] = []
  if (p.kind === 'amount') {
    if (exceedsDiscountCap(p.paid, p.bonus)) {
      out.push(`贈送比例超過 ${LEGAL.MAX_DISCOUNT_RATE * 100}%：《美容定型化契約》規定全額預付折扣率不得高於此上限。`)
    }
    if (needsWrittenContract(p.paid)) {
      out.push(`本次收款達 NT$${LEGAL.WRITTEN_CONTRACT_THRESHOLD.toLocaleString()}：依規定應簽訂書面契約，審閱期不得少於 ${LEGAL.MIN_REVIEW_DAYS} 日。`)
    }
    if (needsPerformanceGuarantee(p.balance, p.kind)) {
      out.push(`未使用餘額已逾 NT$${LEGAL.PERFORMANCE_GUARANTEE_THRESHOLD.toLocaleString()}：超過部分依規定應提供履約保障（金融機構保證／信託／同業保管）。`)
    }
  }
  return out
}
