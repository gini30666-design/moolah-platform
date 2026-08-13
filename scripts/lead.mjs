#!/usr/bin/env node
/**
 * Lead 管理 CLI（2026-08-13）
 *
 * 為什麼需要這支：
 *   Lead ≠ 好客戶。有人只是填了姓名電話，不代表他是美業工作室主。
 *   只看 Lead 數，會把「很會帶填表的人」的廣告當成贏家。
 *   真正的資格判定要 Gini 談過才知道 —— 程式不能自動判。
 *   標記為合格時會送 Meta CAPI 的 QualifiedLead 事件，
 *   Meta 才學得到「什麼樣的人最後是真客戶」。
 *
 * 用法：
 *   node scripts/lead.mjs list                      # 近期名單（含分數與來源）
 *   node scripts/lead.mjs show <leadId>             # 單筆完整資料（含歸因）
 *   node scripts/lead.mjs qualify <leadId> --score 4 --note "一人肌膚管理，月約 80 筆"
 *   node scripts/lead.mjs reject  <leadId> --note "同業探路"
 *   node scripts/lead.mjs status  <leadId> contacted|demo|trial|active|paid|lost
 *
 * 分數（顧問給的分級）：
 *   0 不相關  1 美業從業者  2 有工作室  3 正在找系統  4 願意試用  5 已開始使用
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const env = Object.fromEntries(
  fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8')
    .split('\n').filter(l => l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const argv = process.argv.slice(2)
const cmd = argv[0]
const arg = (name, dflt) => {
  const i = argv.indexOf(`--${name}`)
  return i >= 0 ? argv[i + 1] : dflt
}

const sha = v => v ? crypto.createHash('sha256').update(String(v).trim().toLowerCase()).digest('hex') : undefined
function phoneE164(raw) {
  if (!raw) return undefined
  const d = String(raw).replace(/\D/g, '')
  if (!d) return undefined
  if (d.startsWith('886')) return d
  if (d.startsWith('0') && d.length >= 9) return '886' + d.slice(1)
  if (d.startsWith('9') && d.length === 9) return '886' + d
  return d.length >= 8 ? d : undefined
}

/** 送 QualifiedLead 到 Meta CAPI。沒設權杖就跳過（不擋流程）。 */
async function sendQualified(lead, score) {
  const PIXEL = env.META_PIXEL_ID || env.NEXT_PUBLIC_META_PIXEL_ID
  const TOKEN = env.META_CAPI_ACCESS_TOKEN
  if (!PIXEL || !TOKEN) { console.log('  ⚠️ 未設 CAPI 權杖，略過 Meta 事件'); return }

  const user = {}
  const ph = sha(phoneE164(lead.contact)); if (ph) user.ph = [ph]
  const ex = sha(lead.id); if (ex) user.external_id = [ex]
  if (lead.fbp) user.fbp = lead.fbp
  if (lead.fbc) user.fbc = lead.fbc
  if (Object.keys(user).length === 0) {
    console.log('  ⚠️ 這筆沒有任何可比對欄位（電話/fbp/fbc 皆空），Meta 會丟棄 → 不送')
    return
  }

  const body = {
    data: [{
      event_name: 'QualifiedLead',
      // 用「進線時間」而不是現在 —— Meta 才對得回當時那次廣告點擊
      // ⚠️ 但只接受 7 天內；超過就退回用現在時間（歸因會比較弱）
      event_time: eventTimeFor(lead.created_at),
      event_id: `qualified.${lead.id}`,
      action_source: 'system_generated',
      user_data: user,
      custom_data: {
        lead_score: score,
        content_category: lead.category || '(未填)',
        utm_campaign: lead.utm_campaign || '(none)',
        utm_content: lead.utm_content || '(none)',
      },
    }],
    access_token: TOKEN,
  }
  const res = await fetch(`https://graph.facebook.com/v21.0/${PIXEL}/events`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })
  const j = await res.json().catch(() => ({}))
  console.log(`  Meta CAPI → HTTP ${res.status} ${JSON.stringify(j)}`)
}

function eventTimeFor(createdAt) {
  const now = Math.floor(Date.now() / 1000)
  const t = createdAt ? Math.floor(new Date(createdAt).getTime() / 1000) : now
  const sevenDays = 7 * 86400
  return (now - t) < sevenDays ? t : now
}

function srcOf(l) {
  if (l.utm_source || l.utm_campaign) return `${l.utm_source || '?'}/${l.utm_campaign || '?'}/${l.utm_content || '-'}`
  if (l.fbclid) return 'meta(fbclid)'
  if (l.gclid) return 'google(gclid)'
  return '自然'
}

async function main() {
  if (cmd === 'list' || !cmd) {
    const { data, error } = await sb.from('leads').select('*')
      .order('created_at', { ascending: false }).limit(Number(arg('limit', 30)))
    if (error) throw new Error(error.message)
    if (!data.length) return console.log('（沒有 lead）')
    console.log(`共 ${data.length} 筆\n`)
    for (const l of data) {
      const q = l.qualified === 'yes' ? '✅' : l.qualified === 'no' ? '✖️' : '  '
      const d = (l.created_at || '').slice(0, 16).replace('T', ' ')
      console.log(`${q} ${l.id}  ${d}  ${(l.name || '').padEnd(8)} ${String(l.lead_score ?? '-')}/5  ${(l.status || '').padEnd(10)} ${srcOf(l)}`)
      if (l.note) console.log(`     ↳ ${l.note}`)
    }
    return
  }

  const id = argv[1]
  if (!id) return console.log('缺少 leadId。先跑 `node scripts/lead.mjs list`')
  const { data: lead, error } = await sb.from('leads').select('*').eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  if (!lead) return console.log(`找不到 ${id}`)

  if (cmd === 'show') {
    console.log(JSON.stringify(lead, null, 1))
    return
  }

  if (cmd === 'qualify') {
    const score = Number(arg('score', 4))
    if (!(score >= 0 && score <= 5)) return console.log('--score 要在 0-5')
    const note = arg('note', lead.note || '')
    const { error: e } = await sb.from('leads')
      .update({ qualified: 'yes', lead_score: score, note, status: lead.status === 'new' ? 'contacted' : lead.status })
      .eq('id', id)
    if (e) throw new Error(e.message)
    console.log(`✅ ${id} 標記為合格，分數 ${score}`)
    await sendQualified(lead, score)
    return
  }

  if (cmd === 'reject') {
    const note = arg('note', lead.note || '')
    const { error: e } = await sb.from('leads')
      .update({ qualified: 'no', note, status: 'lost' }).eq('id', id)
    if (e) throw new Error(e.message)
    console.log(`✖️ ${id} 標記為不合格（不會送 Meta 事件）`)
    return
  }

  if (cmd === 'status') {
    const s = argv[2]
    const ok = ['new', 'contacted', 'demo', 'trial', 'active', 'paid', 'lost']
    if (!ok.includes(s)) return console.log(`status 要是：${ok.join(' / ')}`)
    const { error: e } = await sb.from('leads').update({ status: s }).eq('id', id)
    if (e) throw new Error(e.message)
    console.log(`${id} → ${s}`)
    return
  }

  console.log('未知指令。用法見檔案開頭註解。')
}

main().catch(e => { console.error('ERR', e.message); process.exit(1) })
