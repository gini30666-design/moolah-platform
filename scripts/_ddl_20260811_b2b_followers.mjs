// 一次性 DDL（2026-08-11）：b2b_followers
//
// 為什麼要這張表：
// LINE 的機制是「純加好友、沒開口的人」不會出現在 OA Manager 聊天列表，也點不到，
// 但 webhook 的 follow 事件手上其實有他的 userId ——以前我們把它丟掉了，
// 導致廣告帶進來的人加了好友卻永遠聯絡不到（宗翰 2026-08-11 就是這樣跑掉的線索）。
// 存下來之後，有 userId 就能用 push API 一對一敲，不必群發打擾其他正在談的客戶。
import pg from 'pg'
import fs from 'fs'

const env = Object.fromEntries(fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  .split('\n')
  .filter(l => l.includes('=') && !l.trim().startsWith('#'))
  .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]))

const c = new pg.Client({ connectionString: env.SUPABASE_DB_URL })
await c.connect()

await c.query(`
  create table if not exists b2b_followers (
    line_user_id      text primary key,
    display_name      text,
    picture_url       text,
    followed_at       timestamptz not null default now(),
    unfollowed_at     timestamptz,                 -- 有值 = 已封鎖/刪好友，push 會失敗
    first_message_at  timestamptz,                 -- null = 從沒開口（＝聊天列表看不到的那群）
    last_contacted_at timestamptz,                 -- 我們主動 push 的時間
    note              text,
    created_at        timestamptz not null default now()
  )`)

await c.query(`create index if not exists idx_b2b_followers_silent on b2b_followers(first_message_at, unfollowed_at)`)
await c.query(`alter table b2b_followers enable row level security`)

const cols = await c.query(`
  select column_name, data_type from information_schema.columns
  where table_name = 'b2b_followers' order by ordinal_position`)
console.log('b2b_followers 欄位:', cols.rows.map(r => `${r.column_name}:${r.data_type}`).join(', '))
console.log('現有筆數:', (await c.query('select count(*) from b2b_followers')).rows[0].count)
await c.end()
