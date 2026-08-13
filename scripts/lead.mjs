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
 * ⚠️ 為什麼需要 `add`（2026-08-13 發現的結構缺口）：
 *   目前兩個廣告活動的目的地都是 IG Direct —— 付費流量**根本不會經過網站**，
 *   所以不會觸發 Pixel、不會有 UTM、也不會自動變成 leads 的一列。
 *   訊息廣告談進來的人如果不手動記，這張表就永遠只有自然流量，
 *   「哪支廣告帶來好客戶」也就永遠算不出來。
 *   → 談到有意願的人，用 `add` 記一筆，來源填你問到的答案。
 *
 * 用法：
 *   node scripts/lead.mjs list                      # 近期名單（含分數與來源）
 *   node scripts/lead.mjs report                    # ★ 依來源彙總：Lead / 合格 / 合格率
 *   node scripts/lead.mjs show <leadId>             # 單筆完整資料（含歸因）
 *   node scripts/lead.mjs add --name "小美" --contact 0912345678 \
 *        --source "meta:V6C-DM" --category 皮膚管理師 --note "IG DM 進來"
 *   node scripts/lead.mjs qualify <leadId> --score 4 --note "一人肌膚管理，月約 80 筆"
 *   node scripts/lead.mjs reject  <leadId> --note "同業探路"
 *   node scripts/lead.mjs status  <leadId> contacted|demo|trial|active|paid|lost
 *
 * 分數（顧問給的分級）：
 *   0 不相關  1 美業從業者  2 有工作室  3 正在找系統  4 願意試用  5 已開始使用
 *
 * 🔑 --source 就是「你從哪裡看到我們的」的答案。零成本、100% 準確，
 *    比任何追蹤碼都可靠 —— 因為訊息廣告這條路技術上追不到。
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
  // 只串有值的欄位 —— 手動記的 lead 通常只有 source + content，
  // 硬塞 '?' 佔位會讓報表看起來像資料壞掉
  const parts = [l.utm_source, l.utm_campaign, l.utm_content].filter(Boolean)
  if (parts.length) return parts.join('/')
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

  if (cmd === 'report') {
    const { data, error } = await sb.from('leads').select('*')
    if (error) throw new Error(error.message)
    if (!data.length) return console.log('（沒有 lead）')
    const by = new Map()
    for (const l of data) {
      const k = srcOf(l)
      const g = by.get(k) || { lead: 0, qualified: 0, rejected: 0, pending: 0, trial: 0, paid: 0, lost: 0 }
      g.lead++
      if (l.qualified === 'yes') g.qualified++
      else if (l.qualified === 'no') g.rejected++
      else g.pending++
      if (['trial', 'active'].includes(l.status)) g.trial++
      if (l.status === 'paid') g.paid++
      if (l.status === 'lost') g.lost++
      by.set(k, g)
    }
    console.log('來源'.padEnd(30), 'Lead  合格  不合  未判  試用  付費  流失   合格率')
    console.log('-'.repeat(84))
    for (const [k, g] of [...by].sort((a, b) => b[1].lead - a[1].lead)) {
      const judged = g.qualified + g.rejected
      const rate = judged ? `${Math.round(g.qualified / judged * 100)}%` : '—'
      console.log(
        k.slice(0, 29).padEnd(30),
        String(g.lead).padStart(4), String(g.qualified).padStart(5),
        String(g.rejected).padStart(5), String(g.pending).padStart(5),
        String(g.trial).padStart(5), String(g.paid).padStart(5),
        String(g.lost).padStart(5), rate.padStart(8),
      )
    }
    console.log('\n⚠️ 花費不在這裡 —— Meta 那邊的數字要另外拉，再自己除出「每個合格名單成本」。')
    console.log('   合格率的分母是「已判定」的，未判定的不算，否則會被稀釋成假的低合格率。')
    return
  }

  if (cmd === 'add') {
    const name = arg('name'), contact = arg('contact')
    if (!name || !contact) return console.log('至少要 --name 與 --contact')
    const source = arg('source', 'manual')
    const category = arg('category', '')
    const row = {
      id: `lead-${Date.now()}`,
      name, contact, category,
      district: arg('district', ''),
      current_method: arg('method', ''),
      created_at: new Date().toISOString(),
      status: 'contacted',            // 手動建的一定是已經談過了
      plan: arg('plan', 'trial'),
      utm_source: source.split(':')[0] || 'manual',
      utm_content: source.split(':')[1] || '',
      note: arg('note', ''),
      lead_score: Number(arg('score', 1)),
    }
    const { error: e } = await sb.from('leads').insert(row)
    if (e) throw new Error(e.message)
    console.log(`✅ 已記錄 ${row.id}（來源 ${source}）`)
    console.log(`   談完標記合格：node scripts/lead.mjs qualify ${row.id} --score N`)
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
