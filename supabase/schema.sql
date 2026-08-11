-- ============================================================
--  MooLah — Supabase (PostgreSQL) Schema v1
--  從 Google Sheets 遷移。重點：型別正確（不再被試算表亂改格式）
--  + 讓 over-booking 在資料庫層級「不可能發生」的唯一約束。
--  在 Supabase SQL Editor 直接貼上執行即可建立。
-- ============================================================

-- 為了可重跑（開發期），先安全建立。正式資料進來後勿任意 drop。

-- 1) providers（職人）— 對應 providers 分頁 A..X
create table if not exists providers (
  id              text primary key,                 -- A designer-003
  name            text not null,                    -- B
  category        text,                             -- C 髮型設計師…
  description     text,                             -- D
  line_user_id    text,                             -- E 認領綁定（敏感，不對外吐）
  avatar_url      text,                             -- F
  store_name      text,                             -- G
  address         text,                             -- H
  district        text,                             -- I
  business_hours  text,                             -- J
  phone           text,                             -- K（text！保留開頭 0）
  instagram       text,                             -- L
  short_code      text unique,                      -- M /go/{shortCode}
  cover_url       text,                             -- N
  rating          numeric(2,1),                     -- O 4.9
  review_count    integer default 0,                -- P
  years           integer,                          -- Q
  tagline         text,                             -- R
  specialties     text,                             -- S 逗號分隔
  role            text,                             -- T
  agreed_at       timestamptz,                      -- U 合約簽署時間
  plan            text default '' ,                 -- V trial|active|expired|''(舊=正式)
  trial_start_at  timestamptz,                      -- W
  trial_ends_at   timestamptz,                      -- X
  created_at      timestamptz default now()
);

-- 2) services（服務項目）— services 分頁 A..G
create table if not exists services (
  service_id   text primary key,                    -- B designer-003-svc01
  provider_id  text not null references providers(id) on delete cascade, -- A
  name         text not null,                       -- C
  price        integer,                             -- D
  duration     integer,                             -- E 分鐘
  description  text,                                -- F
  image_url    text,                                -- G
  created_at   timestamptz default now()
);
create index if not exists idx_services_provider on services(provider_id);

-- 3) portfolio（作品集）— portfolio 分頁 A..F
create table if not exists portfolio (
  portfolio_id text primary key,                    -- B designer-003-pf01
  provider_id  text not null references providers(id) on delete cascade, -- A
  image_url    text,                                -- C
  caption      text,                                -- D
  sort_order   integer default 0,                   -- E
  created_at   timestamptz default now()            -- F
);
create index if not exists idx_portfolio_provider on portfolio(provider_id);

-- 4) bookings（預約）— bookings 分頁 A..M
create table if not exists bookings (
  booking_id          text primary key,             -- A BK1718...
  provider_id         text not null references providers(id) on delete cascade, -- B
  service_id          text,                         -- C（不強制外鍵：手動預約可能無對應 service）
  customer_name       text not null,                -- D
  customer_line_user_id text,                        -- E
  date                date not null,                -- F 2026-06-14（date 型別）
  time                text not null,                -- G '09:00'（text！保留補零，這就是 over-booking 根因的解法）
  note                text,                         -- H
  created_at          timestamptz default now(),    -- I
  gender              text,                         -- J
  hair_length         text,                         -- K
  customer_phone      text,                         -- L（text！保留開頭 0）
  status              text default 'confirmed'      -- M confirmed|cancelled|completed|no_show
);
create index if not exists idx_bookings_provider_date on bookings(provider_id, date);
create index if not exists idx_bookings_customer on bookings(customer_line_user_id);

-- ★★★ over-booking 殺手：同職人+同日+同時段，未取消者只能有一筆 ★★★
-- 第二筆想插入 → 資料庫直接拒絕（不靠程式比對，物理性防呆）
create unique index if not exists uniq_active_booking
  on bookings (provider_id, date, time)
  where status <> 'cancelled';

-- 5) availability（排班/休假）— availability 分頁 A..F（多型：schedule 或 block）
create table if not exists availability (
  id           bigint generated always as identity primary key,
  provider_id  text not null references providers(id) on delete cascade, -- A
  type         text not null,                       -- B 'schedule'(每週) | 'block'(某日休)
  day_or_date  text,                                -- C schedule=Sunday..Saturday；block=2026-06-20
  start_time   text,                                -- D '09:00'
  end_time     text,                                -- E '18:00'
  active       boolean default true                 -- F false=該天不營業
);
create index if not exists idx_availability_provider on availability(provider_id);

-- 6) waitlist（候補）— waitlist 分頁 A..J
create table if not exists waitlist (
  id                  text primary key,             -- A
  provider_id         text not null references providers(id) on delete cascade,
  service_id          text,
  date                date,
  time                text,
  customer_name       text,
  customer_line_user_id text,
  customer_phone      text,
  created_at          timestamptz default now(),
  status              text default 'pending'        -- pending|notified|converted|cancelled
);
create index if not exists idx_waitlist_provider on waitlist(provider_id);

-- 7) reviews（評價）— reviews 分頁 A..G（A=bookingId，一預約一評）
create table if not exists reviews (
  booking_id    text primary key,                   -- A（dedup：一個預約只能評一次）
  provider_id   text not null references providers(id) on delete cascade,
  customer_name text,
  rating        integer check (rating between 1 and 5),
  comment       text,
  status        text default 'published',
  created_at    timestamptz default now()
);
create index if not exists idx_reviews_provider on reviews(provider_id);

-- 8) customer_notes（客戶備註/標籤）— customer_notes 分頁 A..E
create table if not exists customer_notes (
  provider_id         text not null references providers(id) on delete cascade,
  customer_line_user_id text not null,
  note                text,
  updated_at          timestamptz default now(),
  tags                jsonb default '[]'::jsonb,     -- E 原本存 JSON 字串
  primary key (provider_id, customer_line_user_id)   -- upsert 目標
);

-- 9) blacklist（黑名單）— blacklist 分頁 A..F
create table if not exists blacklist (
  id                  bigint generated always as identity primary key,
  provider_id         text not null references providers(id) on delete cascade,
  customer_line_user_id text,
  customer_name       text,
  reason              text,
  created_at          timestamptz default now(),
  source              text default 'manual'          -- auto|manual
);
create index if not exists idx_blacklist_provider on blacklist(provider_id);

-- 10) leads（招商表單名單）— leads 分頁 A..I
create table if not exists leads (
  id             text primary key,
  name           text,
  category       text,
  district       text,
  contact        text,
  current_method text,
  created_at     timestamptz default now(),
  status         text default 'new',
  plan           text default 'trial'                -- trial|direct
);

-- 11) feedback（封測回報）— feedback 分頁 A..F
create table if not exists feedback (
  id        bigint generated always as identity primary key,
  ts        text,                                    -- 原本存字串時間戳
  area      text,
  severity  text,
  message   text,
  reporter  text,
  ua        text,
  created_at timestamptz default now()
);

-- 12) customer_history（客戶作品歷史 / Karte）— 每位客人每次服務的照片+備註
create table if not exists customer_history (
  id                    bigint generated always as identity primary key,
  provider_id           text not null references providers(id) on delete cascade,
  customer_line_user_id text not null,
  image_url             text,
  note                  text,
  service_name          text,
  created_at            timestamptz default now()
);
create index if not exists idx_customer_history on customer_history(provider_id, customer_line_user_id);
alter table customer_history enable row level security;  -- 僅 service role（API 經 verifyOwner）存取

-- 12) payments（月費付款追蹤，2026-07-05）— Phase1 手動(scripts/payment.mjs)；Phase2 第三方支付 API 寫入
create table if not exists payments (
  id           bigint generated always as identity primary key,
  provider_id  text not null references providers(id) on delete cascade,
  period       text not null,                       -- 'YYYY-MM'
  amount_due   int not null default 699,
  amount_paid  int not null default 0,
  status       text not null default 'unpaid',      -- unpaid | paid | waived | trial
  method       text,                                -- transfer | ecpay | newebpay | ...
  paid_at      timestamptz,
  note         text,
  created_at   timestamptz not null default now(),
  unique (provider_id, period)
);
create index if not exists idx_payments_period on payments(period);
alter table payments enable row level security;  -- 僅 service role

-- 13) b2b_followers（招商 OA @492ejbwx 的好友名冊，2026-08-11）
-- 存在理由：LINE 的「純加好友、沒開口」的人不會出現在 OA Manager 聊天列表、也無法被點選私訊。
-- webhook 的 follow 事件手上有 userId，存下來才聯絡得到（否則只能群發，會打擾正在談的客戶）。
create table if not exists b2b_followers (
  line_user_id      text primary key,
  display_name      text,
  picture_url       text,
  followed_at       timestamptz not null default now(),
  unfollowed_at     timestamptz,                     -- 有值 = 已封鎖/刪好友，push 會失敗
  first_message_at  timestamptz,                     -- null = 從沒開口（＝聊天列表看不到的那群）
  last_contacted_at timestamptz,                     -- 我們主動 push 的時間
  note              text,
  created_at        timestamptz not null default now()
);
create index if not exists idx_b2b_followers_silent on b2b_followers(first_message_at, unfollowed_at);
alter table b2b_followers enable row level security;  -- 僅 service role

-- 14) 儲值卡／次卡（2026-08-11，S3 方案）
-- ⚠️ MooLah 不經手任何金錢：錢由職人線下自己收，系統只記帳。
--    平台代收儲值款項＝《電子支付機構管理條例》第 3 條「收受儲值款項」＝需金管會許可，做不到。
-- ⚠️ 紅線：餘額只能綁單一職人（單一用途預收款）。做成跨職人通用錢包＝「多用途支付使用」＝電支業務＝違法。
create table if not exists customer_credits (
  id                    bigint generated always as identity primary key,
  provider_id           text not null references providers(id) on delete cascade,
  customer_line_user_id text,                            -- 沿用「電話為主鍵」設計，web 訪客可能沒有
  customer_phone        text,
  customer_name         text,
  kind                  text not null check (kind in ('amount','count')),   -- 儲值金 | 次卡
  title                 text not null,
  expires_on            date,                            -- ↓ 三欄為《美容定型化契約應記載及不得記載事項》要求
  refund_terms          text,
  agreed_at             timestamptz,
  status                text not null default 'active' check (status in ('active','closed')),
  note                  text,
  created_at            timestamptz not null default now()
);
create index if not exists idx_credits_provider on customer_credits(provider_id, status);
create index if not exists idx_credits_phone on customer_credits(provider_id, customer_phone);
create index if not exists idx_credits_line on customer_credits(provider_id, customer_line_user_id);
alter table customer_credits enable row level security;

-- 流水帳：餘額 = sum(delta)，不存 balance 欄位（避免「是誰改了餘額」的爭議）
create table if not exists credit_ledger (
  id           bigint generated always as identity primary key,
  credit_id    bigint not null references customer_credits(id) on delete cascade,
  provider_id  text not null,
  entry_type   text not null check (entry_type in ('topup','redeem','adjust','refund','expire','reverse')),
  delta        numeric not null,                          -- 餘額變化量（唯一權威數字）
  paid         numeric not null default 0,                -- 客人實付
  bonus        numeric not null default 0,                -- 贈送（法規：折扣率不得高於 20%）
  booking_id   text,
  service_name text,
  memo         text,
  reversal_of  bigint references credit_ledger(id),       -- 沖正指向被沖正那筆
  created_by   text,
  created_at   timestamptz not null default now()
);
create index if not exists idx_ledger_credit on credit_ledger(credit_id, created_at);
create index if not exists idx_ledger_provider on credit_ledger(provider_id, created_at);
alter table credit_ledger enable row level security;

-- 🔑 保命線：流水帳 append-only。RLS 對 service_role 無效，trigger 有效 → 所以用 trigger。
--    唯一逃生閥 app.allow_ledger_purge='on'（只有直連 DB 的管理腳本會設，app 端永遠不設）
--    存在理由＝解約清資料與 provider cascade 刪除。
create or replace function credit_ledger_append_only() returns trigger
language plpgsql as $$
begin
  if coalesce(current_setting('app.allow_ledger_purge', true), 'off') = 'on' then
    return coalesce(old, new);
  end if;
  raise exception 'credit_ledger is append-only: 要修正請新增一筆 entry_type=reverse 並填 reversal_of';
end $$;
drop trigger if exists trg_credit_ledger_append_only on credit_ledger;
create trigger trg_credit_ledger_append_only
before update or delete on credit_ledger
for each row execute function credit_ledger_append_only();
