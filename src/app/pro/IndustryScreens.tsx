'use client'

/**
 * 產業客製化畫面庫。
 *
 * 對標客立樂「專注於每個產業」的做法：他們每個產業 × 每個功能都配一張獨立的 UI 截圖
 * （美髮=顧客筆記/業績報表/預約提醒、霧眉=術前問卷/術後關懷/預付定金…），
 * 所以看起來「每個產業都是為你做的」。
 *
 * 我們用 HTML 重建同樣效果——好處是內容可以真正客製到每個產業的語言
 * （美髮存染髮配方、採耳記油耳、寵物記剃毛長度、汽車記施工前後）。
 *
 * ⚠️ 每個畫面對應的都是系統實際具備的功能：
 *    作品歷史／服務時長設定／客戶備註標籤／候補名單／爽約標記／週報／今日總覽／LINE 通知卡。
 *    差別只在「該產業會拿它來記什麼」，這是真實的使用差異，不是虛構功能。
 */

const oak = '#A68966'
const oakDeep = '#8a6f4f'
const charcoal = '#2C2825'
const charcoalDeep = '#1a1714'
const cream = '#fbf9f4'

const U = (id: string, w = 300) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`

/* ── 畫面資料型別 ─────────────────────────────────────────────── */
export type Screen =
  | { kind: 'history'; who: string; visits: string; entries: { date: string; label: string; note: string }[]; photos: string[] }
  | { kind: 'duration'; shop: string; services: { name: string; min: number; price: number; hi?: boolean }[] }
  | { kind: 'notes'; who: string; tags: string[]; note: string; photos?: string[] }
  | { kind: 'reminder'; shop: string; service: string; date: string; time: string }
  | { kind: 'waitlist'; slot: string; queue: { name: string; at: string }[] }
  | { kind: 'noshow'; rows: { name: string; date: string; state: '完成' | '爽約' }[] }
  | { kind: 'report'; range: string; deals: number; revenue: number; top: string; pct: number }
  | { kind: 'today'; next: { time: string; name: string; service: string; min: number }; count: number; revenue: number }
  | { kind: 'portfolio'; title: string; photos: string[] }
  | { kind: 'page'; shop: string; tagline: string; photos: string[]; from: number }

/* ── 共用小元件 ───────────────────────────────────────────────── */
function Head({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <p style={{ fontSize: '13px', fontWeight: 700, color: charcoal, lineHeight: 1.3 }}>{children}</p>
      {sub && <p style={{ fontSize: '10px', color: 'rgba(44,40,37,0.48)', marginTop: '3px' }}>{sub}</p>}
    </div>
  )
}
const cardBox: React.CSSProperties = {
  background: '#fff', borderRadius: '11px', padding: '11px 12px',
  border: '1px solid rgba(44,40,37,0.08)',
}

/* ── 各種畫面 ─────────────────────────────────────────────────── */
function ScreenHistory(s: Extract<Screen, { kind: 'history' }>) {
  return (
    <>
      <Head sub={`累計到訪 ${s.visits}`}>{s.who}</Head>
      <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
        {s.photos.map(p => (
          <div key={p} style={{ flex: 1, aspectRatio: '1', borderRadius: '8px', backgroundImage: `url(${U(p, 200)})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
        {s.entries.map((e, i) => (
          <div key={i} style={cardBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: charcoal }}>{e.label}</span>
              <span style={{ fontSize: '9px', color: 'rgba(44,40,37,0.42)' }}>{e.date}</span>
            </div>
            <p style={{ fontSize: '10.5px', color: 'rgba(44,40,37,0.72)', lineHeight: 1.55 }}>{e.note}</p>
          </div>
        ))}
      </div>
    </>
  )
}

function ScreenDuration(s: Extract<Screen, { kind: 'duration' }>) {
  return (
    <>
      <Head sub="每個項目各自設定時長">{s.shop}・服務設定</Head>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {s.services.map(v => (
          <div key={v.name} style={{ ...cardBox, borderColor: v.hi ? oak : 'rgba(44,40,37,0.08)', borderWidth: v.hi ? '1.5px' : '1px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 600, color: charcoal, minWidth: 0 }}>{v.name}</span>
              <span style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '13px', color: oakDeep, flexShrink: 0 }}>NT$ {v.price.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '7px' }}>
              <div style={{ flex: 1, height: '5px', borderRadius: '99px', background: 'rgba(44,40,37,0.08)', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, (v.min / 480) * 100)}%`, height: '100%', background: v.hi ? oak : 'rgba(166,137,102,0.45)' }} />
              </div>
              <span style={{ fontSize: '9.5px', color: v.hi ? oakDeep : 'rgba(44,40,37,0.5)', fontWeight: v.hi ? 700 : 400, flexShrink: 0 }}>
                {v.min >= 60 ? `${Math.floor(v.min / 60)} 小時${v.min % 60 ? ` ${v.min % 60} 分` : ''}` : `${v.min} 分`}
              </span>
            </div>
          </div>
        ))}
      </div>
      <p style={{ fontSize: '9.5px', color: 'rgba(44,40,37,0.45)', marginTop: '10px', lineHeight: 1.5 }}>
        選了哪個服務，它就鎖住對應的整段時間
      </p>
    </>
  )
}

function ScreenNotes(s: Extract<Screen, { kind: 'notes' }>) {
  return (
    <>
      <Head sub="客戶備註">{s.who}</Head>
      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '10px' }}>
        {s.tags.map(t => (
          <span key={t} style={{ fontSize: '9.5px', color: oakDeep, border: `1px solid ${oak}55`, borderRadius: '99px', padding: '4px 9px' }}>{t}</span>
        ))}
      </div>
      <div style={cardBox}>
        <p style={{ fontSize: '9.5px', color: 'rgba(44,40,37,0.45)', marginBottom: '5px' }}>服務筆記</p>
        <p style={{ fontSize: '11px', color: charcoal, lineHeight: 1.65 }}>{s.note}</p>
      </div>
      {s.photos && (
        <div style={{ display: 'flex', gap: '5px', marginTop: '9px' }}>
          {s.photos.map(p => (
            <div key={p} style={{ flex: 1, aspectRatio: '1', borderRadius: '8px', backgroundImage: `url(${U(p, 200)})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
          ))}
        </div>
      )}
    </>
  )
}

function ScreenReminder(s: Extract<Screen, { kind: 'reminder' }>) {
  return (
    <div style={{ margin: '-30px -12px -16px', background: '#7c92a8', padding: '34px 11px 20px', minHeight: '330px' }}>
      <p style={{ textAlign: 'center', fontSize: '9.5px', color: 'rgba(255,255,255,0.85)', background: 'rgba(0,0,0,0.16)', borderRadius: '99px', padding: '3px 10px', width: 'fit-content', margin: '0 auto 12px' }}>
        前一天 18:00 自動送出
      </p>
      <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: charcoalDeep, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: oak, fontSize: '10px', fontFamily: '"Cormorant Garamond", serif' }}>M</div>
        <div style={{ background: cream, borderRadius: '13px', padding: '12px', minWidth: 0, flex: 1 }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: charcoal, marginBottom: '3px' }}>✨ 預約提醒</p>
          <p style={{ fontSize: '10px', color: 'rgba(44,40,37,0.6)', lineHeight: 1.5, marginBottom: '8px' }}>別忘了，明天有一筆預約等著您 🙏</p>
          <div style={{ borderTop: '1px solid rgba(44,40,37,0.1)', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {[['預約日期', s.date], ['預約時段', s.time], ['服務項目', s.service], ['服務店家', s.shop]].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', gap: '8px', fontSize: '10px' }}>
                <span style={{ color: 'rgba(44,40,37,0.45)', width: '48px', flexShrink: 0 }}>{k}</span>
                <span style={{ color: charcoal, fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ background: oakDeep, color: '#fff', textAlign: 'center', fontSize: '10.5px', fontWeight: 600, padding: '7px', borderRadius: '7px', marginTop: '10px' }}>
            查看 / 管理預約
          </div>
        </div>
      </div>
    </div>
  )
}

function ScreenWaitlist(s: Extract<Screen, { kind: 'waitlist' }>) {
  return (
    <>
      <Head sub="時段已滿，開放候補">{s.slot}</Head>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {s.queue.map((q, i) => (
          <div key={i} style={{ ...cardBox, display: 'flex', alignItems: 'center', gap: '9px' }}>
            <span style={{
              width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
              background: i === 0 ? oakDeep : 'rgba(44,40,37,0.1)', color: i === 0 ? '#fff' : 'rgba(44,40,37,0.6)',
              fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
            }}>{i + 1}</span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ fontSize: '11px', fontWeight: 600, color: charcoal }}>{q.name}</p>
              <p style={{ fontSize: '9.5px', color: 'rgba(44,40,37,0.45)' }}>{q.at} 登記</p>
            </div>
          </div>
        ))}
      </div>
      <div style={{ background: 'rgba(166,137,102,0.14)', border: `1px solid ${oak}44`, borderRadius: '10px', padding: '10px 11px', marginTop: '10px' }}>
        <p style={{ fontSize: '10.5px', color: oakDeep, fontWeight: 700, marginBottom: '3px' }}>有人取消了</p>
        <p style={{ fontSize: '10px', color: 'rgba(44,40,37,0.7)', lineHeight: 1.55 }}>
          已自動通知第 1 位候補，先搶先贏。
        </p>
      </div>
    </>
  )
}

function ScreenNoshow(s: Extract<Screen, { kind: 'noshow' }>) {
  return (
    <>
      <Head sub="出席紀錄">客戶管理</Head>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {s.rows.map((r, i) => {
          const bad = r.state === '爽約'
          return (
            <div key={i} style={{ ...cardBox, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: '11px', fontWeight: 600, color: charcoal }}>{r.name}</p>
                <p style={{ fontSize: '9.5px', color: 'rgba(44,40,37,0.45)' }}>{r.date}</p>
              </div>
              <span style={{
                fontSize: '9.5px', fontWeight: 700, padding: '3px 9px', borderRadius: '99px', flexShrink: 0,
                background: bad ? 'rgba(180,83,58,0.12)' : 'rgba(120,150,110,0.14)',
                color: bad ? '#8d3f2c' : '#4a6b41',
              }}>{r.state}</span>
            </div>
          )
        })}
      </div>
      <div style={{ background: 'rgba(180,83,58,0.08)', borderRadius: '10px', padding: '10px 11px', marginTop: '10px' }}>
        <p style={{ fontSize: '10px', color: '#8d3f2c', lineHeight: 1.55 }}>
          累積 2 次爽約，可加入黑名單不再開放預約
        </p>
      </div>
    </>
  )
}

function ScreenReport(s: Extract<Screen, { kind: 'report' }>) {
  return (
    <div style={{ margin: '-30px -12px -16px', background: charcoalDeep, padding: '34px 13px 20px', minHeight: '330px' }}>
      <p style={{ fontSize: '13px', fontWeight: 700, color: cream, marginBottom: '2px' }}>本週成績單</p>
      <p style={{ fontSize: '10px', color: 'rgba(251,249,244,0.5)', marginBottom: '14px' }}>{s.range}</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px', marginBottom: '11px' }}>
        {[['成交', `${s.deals} 筆`], ['營收', `NT$ ${s.revenue.toLocaleString()}`]].map(([k, v]) => (
          <div key={k} style={{ background: 'rgba(166,137,102,0.14)', borderRadius: '10px', padding: '11px 10px' }}>
            <p style={{ fontSize: '9.5px', color: 'rgba(251,249,244,0.55)', marginBottom: '4px' }}>{k}</p>
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '19px', color: cream, lineHeight: 1 }}>{v}</p>
          </div>
        ))}
      </div>
      <div style={{ background: 'rgba(166,137,102,0.14)', borderRadius: '10px', padding: '12px 11px' }}>
        <p style={{ fontSize: '9.5px', color: 'rgba(251,249,244,0.55)', marginBottom: '8px' }}>本週最熱門</p>
        <p style={{ fontSize: '12px', color: cream, fontWeight: 700, marginBottom: '8px' }}>{s.top}</p>
        <div style={{ height: '6px', borderRadius: '99px', background: 'rgba(251,249,244,0.12)', overflow: 'hidden' }}>
          <div style={{ width: `${s.pct}%`, height: '100%', background: oak }} />
        </div>
        <p style={{ fontSize: '10px', color: oak, marginTop: '6px', fontWeight: 600 }}>佔 {s.pct}%</p>
      </div>
      <p style={{ fontSize: '9.5px', color: 'rgba(251,249,244,0.45)', marginTop: '12px', lineHeight: 1.5 }}>
        每週一早上自動推播到你的 LINE
      </p>
    </div>
  )
}

function ScreenToday(s: Extract<Screen, { kind: 'today' }>) {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px', marginBottom: '10px' }}>
        {[
          { l: '今日預約', v: `${s.count}`, u: '筆', p: true },
          { l: '今日營收', v: s.revenue.toLocaleString(), u: 'NT$' },
        ].map(x => (
          <div key={x.l} style={{
            background: x.p ? charcoalDeep : '#fff', borderRadius: '11px', padding: '12px 10px',
            border: x.p ? 'none' : '1px solid rgba(44,40,37,0.08)',
          }}>
            <p style={{ fontSize: '9.5px', color: x.p ? 'rgba(251,249,244,0.7)' : 'rgba(44,40,37,0.6)', marginBottom: '4px', whiteSpace: 'nowrap' }}>{x.l}</p>
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '23px', lineHeight: 1, color: x.p ? cream : oak }}>
              {x.v}<span style={{ fontSize: '9.5px', marginLeft: '3px', color: x.p ? 'rgba(166,137,102,0.85)' : 'rgba(166,137,102,0.7)' }}>{x.u}</span>
            </p>
          </div>
        ))}
      </div>
      <div style={{ background: charcoalDeep, borderRadius: '13px', padding: '13px 12px' }}>
        <span style={{ fontSize: '9px', color: '#231f1b', background: oak, padding: '3px 8px', borderRadius: '99px', fontWeight: 700 }}>下一位 · 還有 25 分</span>
        <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '26px', color: cream, lineHeight: 1, margin: '9px 0 5px' }}>{s.next.time}</p>
        <p style={{ fontSize: '11.5px', color: 'rgba(251,249,244,0.88)', fontWeight: 600 }}>{s.next.name}・{s.next.service}</p>
        <p style={{ fontSize: '10px', color: 'rgba(251,249,244,0.5)', marginTop: '3px' }}>{s.next.min} 分鐘</p>
      </div>
    </>
  )
}

function ScreenPortfolio(s: Extract<Screen, { kind: 'portfolio' }>) {
  return (
    <>
      <Head sub="客人點連結就能看">{s.title}</Head>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
        {s.photos.map((p, i) => (
          <div key={i} style={{
            aspectRatio: i % 3 === 0 ? '3 / 4' : '1',
            borderRadius: '9px', backgroundImage: `url(${U(p, 300)})`, backgroundSize: 'cover', backgroundPosition: 'center',
          }} />
        ))}
      </div>
    </>
  )
}

function ScreenPage(s: Extract<Screen, { kind: 'page' }>) {
  return (
    <>
      <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '18px', color: charcoal, textAlign: 'center', lineHeight: 1.2 }}>{s.shop}</p>
      <p style={{ fontSize: '9.5px', color: oakDeep, textAlign: 'center', fontStyle: 'italic', margin: '4px 0 11px' }}>「{s.tagline}」</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginBottom: '11px' }}>
        {s.photos.map((p, i) => (
          <div key={i} style={{ aspectRatio: i === 0 ? '3 / 4' : '1', borderRadius: '9px', backgroundImage: `url(${U(p, 300)})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        ))}
      </div>
      <div style={{ background: charcoalDeep, color: cream, borderRadius: '10px', padding: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        <span style={{ fontSize: '11.5px', fontWeight: 700 }}>開始預約</span>
        <span style={{ fontSize: '10px', color: oak }}>NT$ {s.from.toLocaleString()} 起</span>
      </div>
      <p style={{ fontSize: '9.5px', color: 'rgba(44,40,37,0.45)', textAlign: 'center', marginTop: '9px', lineHeight: 1.5 }}>
        專屬網址＋免費客製立牌，貼 IG 或放店裡
      </p>
    </>
  )
}

/* ── 手機外框 + 分派 ──────────────────────────────────────────── */
export function IndustryScreen({ screen }: { screen: Screen }) {
  let inner: React.ReactNode = null
  switch (screen.kind) {
    case 'history':   inner = <ScreenHistory {...screen} />; break
    case 'duration':  inner = <ScreenDuration {...screen} />; break
    case 'notes':     inner = <ScreenNotes {...screen} />; break
    case 'reminder':  inner = <ScreenReminder {...screen} />; break
    case 'waitlist':  inner = <ScreenWaitlist {...screen} />; break
    case 'noshow':    inner = <ScreenNoshow {...screen} />; break
    case 'report':    inner = <ScreenReport {...screen} />; break
    case 'today':     inner = <ScreenToday {...screen} />; break
    case 'portfolio': inner = <ScreenPortfolio {...screen} />; break
    case 'page':      inner = <ScreenPage {...screen} />; break
  }
  return (
    <div style={{
      // clamp 讓手機隨視窗縮放，固定 px 會在中等寬度擠爆版面
      width: 'clamp(196px, 20vw, 232px)', flexShrink: 0, borderRadius: '30px', padding: '9px',
      background: 'linear-gradient(160deg, #3a3430, #211d1a)',
      boxShadow: '0 22px 50px rgba(0,0,0,0.4)',
    }}>
      <div style={{ borderRadius: '22px', overflow: 'hidden', background: cream, position: 'relative' }}>
        <div style={{
          position: 'absolute', top: '7px', left: '50%', transform: 'translateX(-50%)',
          width: '58px', height: '15px', borderRadius: '99px', background: '#221e1b', zIndex: 3,
        }} />
        <div key={screen.kind + JSON.stringify(screen).slice(0, 40)}
             style={{ padding: '30px 12px 16px', minHeight: '352px', animation: 'scrFade .4s cubic-bezier(0.16,1,0.3,1)' }}>
          {inner}
        </div>
      </div>
      <style>{`
        @keyframes scrFade { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }
        @media (prefers-reduced-motion: reduce) { [style*="scrFade"] { animation: none !important } }
      `}</style>
    </div>
  )
}
