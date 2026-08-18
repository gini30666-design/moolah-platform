// 一次性 DDL（2026-08-18）：provider_members ＋ member_invites
//
// 為什麼要這兩張表：
// 後台原本是嚴格的一人一帳號（verifyOwner 拿 providers.line_user_id 做完全相等比對）。
// 彤（Wen 集團第一位）有客服要協助處理預約，集團後面 10–20 位美容師也會有同樣需求。
//
// 設計要點：
// 1. owner 不進 provider_members ——「誰是老闆」仍然只看 providers.line_user_id。
//    這樣 LINE 推播、認領、合約、對帳全部零改動，客服拿到的是「後台可視性」不是「通知」。
// 2. PK = (provider_id, line_user_id) → 天然多對多：
//    一個後台 N 個客服 ✅、一個客服 N 個後台 ✅（集團總部客服的情境）。
// 3. 邀請一定要一次性亂數碼，不能用 /claim/{providerId}?staff=1 那種固定連結 ——
//    providerId 印在立牌 QR 與短網址上是公開資訊，等於誰看到立牌都能變客服。
import pg from 'pg'
import fs from 'fs'

const env = Object.fromEntries(fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  .split('\n')
  .filter(l => l.includes('=') && !l.trim().startsWith('#'))
  .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]))

const c = new pg.Client({ connectionString: env.SUPABASE_DB_URL })
await c.connect()

await c.query(`
  create table if not exists provider_members (
    provider_id   text not null references providers(id) on delete cascade,
    line_user_id  text not null,
    -- 'staff'   ＝ 只能處理預約（看/標完成/取消/爽約/手動建單/客戶備註/候補）
    -- 'manager' ＝ 等同老闆的操作權（可改服務價格、排班、作品集、儲值卡）
    -- 兩種都實作好，實際給哪一種由業務在上線前決定
    role          text not null default 'staff' check (role in ('staff','manager')),
    display_name  text,
    invited_by    text,
    created_at    timestamptz not null default now(),
    primary key (provider_id, line_user_id)
  )`)

// 反查「這個人有哪些後台」——多帳號切換畫面每次載入都會打
await c.query(`create index if not exists idx_provider_members_user on provider_members(line_user_id)`)

await c.query(`
  create table if not exists member_invites (
    code        text primary key,
    provider_id text not null references providers(id) on delete cascade,
    role        text not null default 'staff' check (role in ('staff','manager')),
    created_by  text,
    created_at  timestamptz not null default now(),
    expires_at  timestamptz not null,
    used_at     timestamptz,
    used_by     text
  )`)

await c.query(`create index if not exists idx_member_invites_provider on member_invites(provider_id)`)

await c.query(`alter table provider_members enable row level security`)
await c.query(`alter table member_invites enable row level security`)

for (const t of ['provider_members', 'member_invites']) {
  const cols = await c.query(`
    select column_name, data_type from information_schema.columns
    where table_name = $1 order by ordinal_position`, [t])
  console.log(`${t}:`, cols.rows.map(r => `${r.column_name}:${r.data_type}`).join(', '))
  console.log(`  現有筆數:`, (await c.query(`select count(*) from ${t}`)).rows[0].count)
}
await c.end()
