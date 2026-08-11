// 一次性 DDL（2026-08-11）：儲值卡／次卡（S3 方案）
//
// ▍為什麼這樣設計
// 約 1/3 廣告進線第一句就問「有儲值功能嗎」。但**平台代收儲值款項＝電子支付業務**
// （《電子支付機構管理條例》第 3 條「收受儲值款項」），需金管會許可＋最低實收資本額
// → 永翔數位做不到，也不該做。
//
// 所以 MooLah 只做「帳本」：錢在線下由職人自己收（現金／轉帳／他自己的刷卡機），
// 系統只記錄餘額與每一筆異動。MooLah 從頭到尾不經手任何一塊錢。
//
// ⚠️ 設計紅線：餘額**只能綁單一職人**（單一用途預收款）。
//    若做成「MooLah 所有職人通用的錢包」＝條文中的「多用途支付使用」＝電子支付業務＝違法。
//    credit 一律 references providers(id)，不存在跨職人餘額。
//
// ▍為什麼要 append-only ledger
// 這個功能讓 MooLah 從「預約工具」變成「錢的紀錄者」。數字出錯時糾紛發生在
// 職人與客人之間，但職人會怪系統。所以：
//   · 餘額**不存欄位**，一律由流水帳加總算出 → 沒有「是誰改了餘額」的爭議
//   · 流水帳**禁止 UPDATE / DELETE**（DB trigger 強制，連 service_role 也擋）
//     要修正只能新增一筆沖正（reversal_of 指向原筆）→ 全程可追溯
import pg from 'pg'
import fs from 'fs'

const env = Object.fromEntries(fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  .split('\n')
  .filter(l => l.includes('=') && !l.trim().startsWith('#'))
  .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]))

const c = new pg.Client({ connectionString: env.SUPABASE_DB_URL })
await c.connect()

// ── 卡片主檔（一位客人在一位職人這裡可以有多張：儲值金一張、次卡數張）──
await c.query(`
  create table if not exists customer_credits (
    id                    bigint generated always as identity primary key,
    provider_id           text not null references providers(id) on delete cascade,
    -- 客人識別：沿用 2026-08-01 的「電話為主鍵」設計（web 訪客沒有 LINE ID）
    customer_line_user_id text,
    customer_phone        text,
    customer_name         text,
    kind                  text not null check (kind in ('amount','count')),  -- 儲值金 | 次卡
    title                 text not null,                 -- 卡名，如「洗剪護 10 次卡」
    -- 下面三欄是《美容定型化契約應記載及不得記載事項》要求的，不是我們自己想加的
    expires_on            date,                           -- 有效期限
    refund_terms          text,                           -- 退費規則
    agreed_at             timestamptz,                    -- 客人確認時間（存證）
    status                text not null default 'active' check (status in ('active','closed')),
    note                  text,
    created_at            timestamptz not null default now()
  )`)
await c.query(`create index if not exists idx_credits_provider on customer_credits(provider_id, status)`)
await c.query(`create index if not exists idx_credits_phone on customer_credits(provider_id, customer_phone)`)
await c.query(`create index if not exists idx_credits_line on customer_credits(provider_id, customer_line_user_id)`)
await c.query(`alter table customer_credits enable row level security`)

// ── 流水帳（append-only，餘額 = sum(delta)）──
await c.query(`
  create table if not exists credit_ledger (
    id           bigint generated always as identity primary key,
    credit_id    bigint not null references customer_credits(id) on delete cascade,
    provider_id  text not null,                           -- 冗餘欄，讓查詢能直接 filter
    entry_type   text not null check (entry_type in ('topup','redeem','adjust','refund','expire','reverse')),
    delta        numeric not null,                        -- 餘額變化量（唯一權威數字）；amount 型=金額、count 型=次數
    paid         numeric not null default 0,              -- 客人實際付的錢（只有 topup 有意義）
    bonus        numeric not null default 0,              -- 贈送（法規：全額預付折扣率不得高於 20%）
    booking_id   text,
    service_name text,
    memo         text,
    reversal_of  bigint references credit_ledger(id),     -- 沖正指向被沖正的那一筆
    created_by   text,                                    -- 操作者 line_user_id
    created_at   timestamptz not null default now()
  )`)
await c.query(`create index if not exists idx_ledger_credit on credit_ledger(credit_id, created_at)`)
await c.query(`create index if not exists idx_ledger_provider on credit_ledger(provider_id, created_at)`)
await c.query(`alter table credit_ledger enable row level security`)

// ⚠️ 保命線：流水帳只能新增。這是 DB 層強制，**連 service_role 也擋得住**
//    （RLS 對 service_role 無效，但 trigger 有效）——這正是選 trigger 而非 RLS 的原因。
//
// 🔑 唯一的逃生閥：session 變數 app.allow_ledger_purge='on'。
//    存在理由＝解約清資料（moolah-ob 功能 D）與 provider 刪除的 cascade 需要真的刪得掉。
//    app 端（Supabase client）從不設這個變數，所以應用程式永遠刪不動；
//    只有直連 DB 的管理腳本能明確開啟 → 「不可竄改」的保證對線上服務仍然成立。
await c.query(`
  create or replace function credit_ledger_append_only() returns trigger
  language plpgsql as $$
  begin
    if coalesce(current_setting('app.allow_ledger_purge', true), 'off') = 'on' then
      return coalesce(old, new);
    end if;
    raise exception 'credit_ledger is append-only: 要修正請新增一筆 entry_type=reverse 並填 reversal_of';
  end $$`)
await c.query(`drop trigger if exists trg_credit_ledger_append_only on credit_ledger`)
await c.query(`
  create trigger trg_credit_ledger_append_only
  before update or delete on credit_ledger
  for each row execute function credit_ledger_append_only()`)

// ── 驗證 ──
const cols = await c.query(`
  select table_name, column_name from information_schema.columns
  where table_name in ('customer_credits','credit_ledger') order by table_name, ordinal_position`)
console.log('欄位:')
for (const t of ['customer_credits', 'credit_ledger']) {
  console.log(' ', t, '→', cols.rows.filter(r => r.table_name === t).map(r => r.column_name).join(', '))
}

// append-only 實測：插一筆 → 試改 → 應該要噴錯
await c.query(`insert into providers (id, name) values ('__ddl_test__','DDL測試') on conflict (id) do nothing`)
const ins = await c.query(`
  insert into customer_credits (provider_id, kind, title, customer_phone)
  values ('__ddl_test__','amount','DDL測試卡','0900000000') returning id`)
const cid = ins.rows[0].id
const le = await c.query(`insert into credit_ledger (credit_id, provider_id, entry_type, delta) values ($1,'__ddl_test__','topup',100) returning id`, [cid])
let blocked = { update: false, delete: false }
try { await c.query(`update credit_ledger set delta = 9999 where id = $1`, [le.rows[0].id]) } catch { blocked.update = true }
try { await c.query(`delete from credit_ledger where id = $1`, [le.rows[0].id]) } catch { blocked.delete = true }
console.log('append-only 保護：UPDATE 被擋 =', blocked.update, '／ DELETE 被擋 =', blocked.delete)

// 逃生閥實測：開啟後 cascade 刪得掉（解約清資料要靠這個）
// ⚠️ set local 只在交易內有效，一定要包 BEGIN/COMMIT，否則是無聲的 no-op
await c.query('begin')
await c.query(`set local app.allow_ledger_purge = 'on'`)
await c.query(`delete from providers where id = '__ddl_test__'`)
await c.query('commit')
const left = await c.query(`select count(*) from credit_ledger`)
console.log('測試資料已清除，credit_ledger 剩', left.rows[0].count, '筆')
await c.end()
