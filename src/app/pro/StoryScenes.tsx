/**
 * /pro 廣告頁的「圖說故事」元件庫。
 *
 * 設計原則（對標客立樂的視覺語言）：
 *   真實產品畫面當主角 → 情境照當背景 → 手繪曲線引導視線 → 短標註點題。
 *   文字只是註解，圖負責說服。
 *
 * ⚠️ 所有 UI 重建的欄位、文案、色彩都對應系統實際輸出
 *    （Flex 卡片見 src/lib/line.ts，後台統計見 [providerId]/admin）。
 *    示範用的客戶名稱與數字為畫面示意，區塊角落已標示。
 */

const oak = '#A68966'
const oakDeep = '#8a6f4f'
const charcoal = '#2C2825'
const charcoalDeep = '#1a1714'
const cream = '#fbf9f4'

const U = (id: string, w = 1400) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`

/**
 * 場景背景照。
 * ⚠️ 全部是自家 gpt-image 生成的原創圖（放在 public/），**不用圖庫也不用 Pinterest 圖＝零授權風險**。
 * 調性＝紀實真實感（職人真的在做手藝），不是擺拍的圖庫感。要換圖就換 public/ 那幾張同名檔。
 */
export const SCENE_PHOTOS = {
  // 桌機（3:2 橫式）
  working: '/pro-scene-work.jpg',    // 美甲師低頭銼指甲、雙手都在忙 → 場景1「你手上在忙，它替你接單」
  styling: '/pro-scene-notes.jpg',   // 做臉手部特寫、貼身服務 → 場景4「上次的配方，下次點開就有」
  // 手機（2:3 直式）— 同一個場景重新構圖，主體在下三分之二、上方留空給標題
  workingMobile: '/pro-scene-work-m.jpg',
  stylingMobile: '/pro-scene-notes-m.jpg',
}

/* ────────────────────────────────────────────────────────────
   手繪引導線 — 客立樂用的那種細捲曲線，帶手感、非幾何
   ──────────────────────────────────────────────────────────── */
export function HandDrawnCurve({
  d, width = 120, height = 90, color = oak, flip = false, style,
}: { d: string; width?: number; height?: number; color?: string; flip?: boolean; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 120 90" width={width} height={height} fill="none" aria-hidden
      style={{ transform: flip ? 'scaleX(-1)' : undefined, overflow: 'visible', ...style }}
    >
      <path d={d} stroke={color} strokeWidth="1.6" strokeLinecap="round" opacity="0.75" />
    </svg>
  )
}

// 幾條備用的手繪路徑（模擬鋼筆一筆畫過的弧度）
export const CURVES = {
  hookDown: 'M6 4 C 34 10, 20 40, 46 46 C 70 52, 74 70, 62 84',
  swoopRight: 'M4 70 C 26 74, 40 52, 56 40 C 74 26, 92 24, 112 30',
  loopLeft: 'M112 8 C 84 12, 96 40, 70 48 C 46 56, 40 74, 54 86',
}

/* ────────────────────────────────────────────────────────────
   標註文字 — 貼在 UI 旁邊點題的短句
   ──────────────────────────────────────────────────────────── */
export function Annotation({
  children, align = 'left', tone = 'light',
}: { children: React.ReactNode; align?: 'left' | 'right'; tone?: 'light' | 'dark' }) {
  return (
    <p style={{
      fontSize: 'clamp(14px, 4vw, 16px)',
      fontWeight: 700,
      lineHeight: 1.5,
      color: tone === 'light' ? cream : charcoal,
      textAlign: align,
      textShadow: tone === 'light' ? '0 2px 12px rgba(0,0,0,0.5)' : 'none',
      textWrap: 'balance',
    }}>
      {children}
    </p>
  )
}

/* ────────────────────────────────────────────────────────────
   手機外框 — 包住任何畫面內容
   ──────────────────────────────────────────────────────────── */
/**
 * width 傳數字時會自動轉成 clamp()，讓手機隨視窗縮放。
 * 固定 px 會在中等寬度（900–1300）把版面擠爆——這是「視窗縮小但元素不縮」的根因。
 */
export function PhoneFrame({ children, width = 232 }: { children: React.ReactNode; width?: number | string }) {
  const w = typeof width === 'number'
    ? `clamp(${Math.round(width * 0.78)}px, ${(width / 5.2).toFixed(1)}vw, ${width}px)`
    : width

  /**
   * ⚠️ 所有尺寸一律用 --pw（機身寬度）等比計算，不可寫死 px。
   * 舊版把圓角寫死 38px，但同頁手機寬度從 197px 到 320px 都有 →
   * 小的顯得過圓、大的顯得方，整組比例不一致，就是「潦草」的主因。
   * 比例取自實機：圓角 ≈ 13.5%W、邊框 ≈ 2.1%W、動態島 ≈ 30%W。
   */
  const vars = { ['--pw' as string]: w } as React.CSSProperties
  const rOuter = 'calc(var(--pw) * 0.135)'
  const rBody = 'calc(var(--pw) * 0.129)'
  const rScreen = 'calc(var(--pw) * 0.108)'
  const bezel = 'calc(var(--pw) * 0.021)'
  const btnW = 'calc(var(--pw) * 0.009)'
  const btnOff = 'calc(var(--pw) * -0.005)'

  return (
    <div style={{ ...vars, width: 'var(--pw)', flexShrink: 0, position: 'relative' }}>
      {/* 側邊實體按鍵：靜音鍵 + 音量 ×2（左）、電源鍵（右）。等比且貼齊機身邊緣 */}
      {[
        { top: '17.5%', h: '3.4%' },
        { top: '24%', h: '6.8%' },
        { top: '32.5%', h: '6.8%' },
      ].map((b, i) => (
        <span key={i} aria-hidden style={{
          position: 'absolute', left: btnOff, top: b.top, width: btnW, height: b.h,
          borderRadius: '99px 0 0 99px',
          background: 'linear-gradient(90deg, #0f0d0b 0%, #4a423b 55%, #221e1a 100%)',
        }} />
      ))}
      <span aria-hidden style={{
        position: 'absolute', right: btnOff, top: '26%', width: btnW, height: '10.5%',
        borderRadius: '0 99px 99px 0',
        background: 'linear-gradient(270deg, #0f0d0b 0%, #4a423b 55%, #221e1a 100%)',
      }} />

      {/* 鈦金屬外緣：漸層模擬四面反光，內縮一圈成為機身 */}
      <div style={{
        borderRadius: rOuter,
        padding: 'calc(var(--pw) * 0.007)',
        background: 'linear-gradient(150deg, #8b8078 0%, #38312c 18%, #191512 46%, #2e2823 72%, #7d726a 100%)',
        boxShadow: '0 34px 64px rgba(0,0,0,0.46), 0 10px 24px rgba(0,0,0,0.28)',
      }}>
        <div style={{
          borderRadius: rBody,
          padding: bezel,
          background: 'linear-gradient(165deg, #1d1917 0%, #0c0a09 100%)',
          /* 機身內緣的一圈細高光，讓邊框有厚度而不是純黑塊 */
          boxShadow: 'inset 0 0 0 0.5px rgba(255,255,255,0.10)',
        }}>
          <div style={{ borderRadius: rScreen, overflow: 'hidden', background: cream, position: 'relative' }}>
            {/* Dynamic Island — 純黑膠囊，鏡頭只留極淡反光（真機幾乎看不見） */}
            <div aria-hidden style={{
              position: 'absolute', top: 'calc(var(--pw) * 0.030)', left: '50%', transform: 'translateX(-50%)',
              width: 'calc(var(--pw) * 0.30)', height: 'calc(var(--pw) * 0.088)',
              borderRadius: '99px', background: '#080706', zIndex: 4,
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
              paddingRight: 'calc(var(--pw) * 0.026)',
            }}>
              <span style={{
                width: 'calc(var(--pw) * 0.026)', height: 'calc(var(--pw) * 0.026)', borderRadius: '50%',
                background: 'radial-gradient(circle at 34% 28%, rgba(90,110,130,0.55) 0%, rgba(10,12,14,1) 62%)',
              }} />
            </div>

            {children}

            {/* 螢幕玻璃反光：收斂成一道窄高光，過強會讓內容變灰 */}
            <div aria-hidden style={{
              position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none',
              background: 'linear-gradient(122deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.035) 16%, rgba(255,255,255,0) 34%)',
            }} />
            {/* 螢幕內緣：暗角 + 一圈細邊，貼合機身 */}
            <div aria-hidden style={{
              position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none',
              borderRadius: rScreen,
              boxShadow: 'inset 0 0 0 0.5px rgba(0,0,0,0.55), inset 0 0 12px rgba(0,0,0,0.18)',
            }} />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────
   LINE 通知堆疊 — 對應 providerBookingFlex（設計師收到的新預約）
   ──────────────────────────────────────────────────────────── */
const NOTIFS = [
  { t: '剛剛',   name: '王小姐', svc: '染髮 + 護髮', when: '7/28 (一) 14:00' },
  { t: '3 分鐘前', name: '陳先生', svc: '剪髮',       when: '7/28 (一) 16:30' },
  { t: '18 分鐘前', name: '林小姐', svc: '燙髮',      when: '7/29 (二) 11:00' },
  { t: '1 小時前', name: '黃小姐', svc: '護髮',       when: '7/30 (三) 15:00' },
]

export function LockScreenNotifs() {
  return (
    <div style={{ padding: '34px 10px 16px', background: 'linear-gradient(170deg, #23201d, #14120f)' }}>
      <p style={{ textAlign: 'center', color: 'rgba(251,249,244,0.95)', fontSize: '42px', fontWeight: 300, lineHeight: 1, letterSpacing: '-0.02em' }}>23:41</p>
      <p style={{ textAlign: 'center', color: 'rgba(251,249,244,0.55)', fontSize: '11px', marginTop: '5px', marginBottom: '16px' }}>7月27日 星期日</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
        {NOTIFS.map((n, i) => (
          <div key={i} style={{
            background: 'rgba(251,249,244,0.93)', borderRadius: '13px', padding: '9px 10px',
            display: 'flex', gap: '8px', alignItems: 'flex-start',
            opacity: 1 - i * 0.14,
          }}>
            <div style={{
              width: '22px', height: '22px', borderRadius: '6px', background: oak, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '10px', color: '#fff', fontWeight: 700,
            }}>M</div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '6px', alignItems: 'baseline' }}>
                {/* 不用 emoji：部分裝置／截圖環境缺字型會變成方框 */}
                <span style={{ fontSize: '11px', fontWeight: 700, color: charcoal }}>新預約</span>
                <span style={{ fontSize: '9px', color: 'rgba(44,40,37,0.45)', flexShrink: 0 }}>{n.t}</span>
              </div>
              <p style={{ fontSize: '10.5px', color: 'rgba(44,40,37,0.8)', lineHeight: 1.45, marginTop: '2px' }}>
                {n.name}・{n.svc}<br />{n.when}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────
   LINE 對話中的提醒卡 — 對應 customerReminderFlex
   ──────────────────────────────────────────────────────────── */
function InfoRow({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: 'flex', gap: '10px', fontSize: '11px', lineHeight: 1.6 }}>
      <span style={{ color: 'rgba(44,40,37,0.45)', width: '52px', flexShrink: 0 }}>{k}</span>
      <span style={{ color: charcoal, fontWeight: 600, minWidth: 0 }}>{v}</span>
    </div>
  )
}

export function ReminderChat() {
  return (
    <div style={{ background: '#7c92a8', padding: '30px 12px 16px', minHeight: '340px' }}>
      <p style={{ textAlign: 'center', fontSize: '10px', color: 'rgba(255,255,255,0.85)', background: 'rgba(0,0,0,0.16)', borderRadius: '99px', padding: '3px 10px', width: 'fit-content', margin: '0 auto 14px' }}>
        7月27日 週日 18:00
      </p>
      <div style={{ display: 'flex', gap: '7px', alignItems: 'flex-start' }}>
        <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: charcoalDeep, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: oak, fontSize: '11px', fontFamily: '"Cormorant Garamond", serif' }}>M</div>
        <div style={{ background: cream, borderRadius: '14px', padding: '13px 13px 11px', minWidth: 0, flex: 1 }}>
          <p style={{ fontSize: '14px', fontWeight: 700, color: charcoal, marginBottom: '4px' }}>✨ 預約提醒</p>
          <p style={{ fontSize: '10.5px', color: 'rgba(44,40,37,0.6)', lineHeight: 1.55, marginBottom: '9px' }}>
            別忘了，明天有一筆預約等著您 🙏
          </p>
          <div style={{ borderTop: '1px solid rgba(44,40,37,0.1)', paddingTop: '9px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <InfoRow k="預約日期" v="7/28 (一)" />
            <InfoRow k="預約時段" v="14:00" />
            <InfoRow k="服務項目" v="染髮 + 護髮" />
            <InfoRow k="服務店家" v="Studio Aurelia" />
          </div>
          <div style={{ background: oakDeep, color: '#fff', textAlign: 'center', fontSize: '11px', fontWeight: 600, padding: '8px', borderRadius: '7px', marginTop: '11px' }}>
            查看 / 管理預約
          </div>
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────
   客戶資料卡 — 對應後台客戶面板（備註 / 標籤 / 作品歷史）
   ──────────────────────────────────────────────────────────── */
export function CustomerCard() {
  return (
    <div style={{ background: cream, padding: '30px 14px 16px' }}>
      <div style={{ textAlign: 'center', marginBottom: '13px' }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '50%', margin: '0 auto 8px',
          backgroundImage: `url(${U('photo-1675034743339-0b0747047727', 200)})`, backgroundSize: 'cover', backgroundPosition: 'center',
          border: `2px solid ${oak}`,
        }} />
        <p style={{ fontSize: '15px', fontWeight: 700, color: charcoal }}>王小姐</p>
        <p style={{ fontSize: '11px', color: 'rgba(44,40,37,0.5)', marginTop: '2px' }}>累計到訪 6 次</p>
        <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', marginTop: '9px', flexWrap: 'wrap' }}>
          {['細軟髮質', '偏好自然棕', '會提早到'].map(t => (
            <span key={t} style={{ fontSize: '9.5px', color: oakDeep, border: `1px solid ${oak}55`, borderRadius: '99px', padding: '3px 8px' }}>{t}</span>
          ))}
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '11px', padding: '11px 12px', marginBottom: '9px' }}>
        <p style={{ fontSize: '9.5px', color: 'rgba(44,40,37,0.45)', marginBottom: '5px', letterSpacing: '0.05em' }}>服務筆記</p>
        <p style={{ fontSize: '11.5px', color: charcoal, lineHeight: 1.6 }}>
          上次配方：8/0 + 7/43 = 1:1，氧化劑 6%<br />
          染後用護色洗，客人說很滿意
        </p>
      </div>

      <div style={{ background: '#fff', borderRadius: '11px', padding: '11px 12px' }}>
        <p style={{ fontSize: '9.5px', color: 'rgba(44,40,37,0.45)', marginBottom: '7px', letterSpacing: '0.05em' }}>作品歷史</p>
        <div style={{ display: 'flex', gap: '5px' }}>
          {[
            'photo-1634449571010-02389ed0f9b0',
            'photo-1582095133179-bfd08e2fc6b3',
            'photo-1634449571017-5fecfd26ad76',
          ].map(id => (
            <div key={id} style={{
              flex: 1, aspectRatio: '1', borderRadius: '7px',
              backgroundImage: `url(${U(id, 160)})`, backgroundSize: 'cover', backgroundPosition: 'center',
            }} />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────
   後台今日總覽 — 對應 admin 的 2×2 統計卡 + 「下一位」錨點卡
   ──────────────────────────────────────────────────────────── */
export function AdminToday() {
  const stats = [
    { label: '今日預約', value: '4', unit: '筆', primary: true },
    { label: '今日營收', value: '6,800', unit: 'NT$' },
    { label: '本月預約', value: '31', unit: '筆' },
    { label: '本月營收', value: '52,400', unit: 'NT$' },
  ]
  return (
    <div style={{ background: cream, padding: '30px 12px 16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px', marginBottom: '11px' }}>
        {stats.map(s => (
          <div key={s.label} style={{
            background: s.primary ? charcoalDeep : '#fff',
            borderRadius: '12px', padding: '13px 11px',
            border: s.primary ? 'none' : `1px solid ${oak}26`,
          }}>
            <p style={{ fontSize: '9.5px', color: s.primary ? 'rgba(251,249,244,0.72)' : 'rgba(44,40,37,0.68)', marginBottom: '5px', whiteSpace: 'nowrap' }}>{s.label}</p>
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '26px', lineHeight: 1, color: s.primary ? cream : oak, fontWeight: 500 }}>
              {s.value}<span style={{ fontSize: '10px', marginLeft: '3px', color: s.primary ? 'rgba(166,137,102,0.85)' : 'rgba(166,137,102,0.7)' }}>{s.unit}</span>
            </p>
          </div>
        ))}
      </div>

      {/* 下一位錨點卡 */}
      <div style={{ background: charcoalDeep, borderRadius: '14px', padding: '14px 13px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '9px' }}>
          <span style={{ fontSize: '9.5px', color: '#231f1b', background: oak, padding: '3px 9px', borderRadius: '99px', fontWeight: 700 }}>下一位 · 還有 25 分</span>
        </div>
        <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '30px', color: cream, lineHeight: 1, marginBottom: '6px' }}>14:00</p>
        <p style={{ fontSize: '12px', color: 'rgba(251,249,244,0.85)', fontWeight: 600 }}>王小姐・染髮 + 護髮</p>
        <p style={{ fontSize: '10.5px', color: 'rgba(251,249,244,0.5)', marginTop: '3px' }}>0912-345-678 · 120 分鐘</p>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────
   浮動卡片 — 可獨立於手機之外散佈的 UI 元素
   （客立樂把 UI 從手機拉出來放大、錯落擺放的那種做法）
   ──────────────────────────────────────────────────────────── */
export function FloatCard({
  children, width, tint = 'light', pad = '14px 15px',
}: { children: React.ReactNode; width?: number | string; tint?: 'light' | 'dark'; pad?: string }) {
  const dark = tint === 'dark'
  return (
    <div style={{
      width, padding: pad,
      background: dark ? charcoalDeep : '#fff',
      color: dark ? cream : charcoal,
      borderRadius: '15px',
      border: dark ? '1px solid rgba(166,137,102,0.3)' : `1px solid ${oak}22`,
      boxShadow: dark ? '0 16px 40px rgba(0,0,0,0.45)' : '0 14px 36px rgba(26,23,20,0.16)',
    }}>
      {children}
    </div>
  )
}

/** 放大版「新預約」卡 — 對應 providerBookingFlex 完整內容 */
export function NewBookingCard() {
  return (
    <FloatCard width="100%" pad="15px 16px">
      <p style={{ fontSize: '14px', fontWeight: 700, color: charcoal, marginBottom: '10px' }}>新預約</p>
      <div style={{ borderTop: '1px solid rgba(44,40,37,0.1)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <InfoRow k="客戶" v="王小姐" />
        <InfoRow k="電話" v="0912-345-678" />
        <InfoRow k="服務項目" v="染髮 + 護髮" />
        <InfoRow k="預約日期" v="7/28 (一)" />
        <InfoRow k="預約時段" v="14:00" />
      </div>
      <div style={{ display: 'flex', gap: '7px', marginTop: '12px' }}>
        <div style={{ flex: 1, background: oakDeep, color: '#fff', textAlign: 'center', fontSize: '11px', fontWeight: 600, padding: '8px', borderRadius: '7px' }}>聯絡客人</div>
        <div style={{ flex: 1, background: 'rgba(44,40,37,0.07)', color: charcoal, textAlign: 'center', fontSize: '11px', fontWeight: 600, padding: '8px', borderRadius: '7px' }}>查看後台</div>
      </div>
    </FloatCard>
  )
}

/** 提醒設定卡 — 對應 cron/reminder 的實際行為（前一日固定時間送出） */
export function ReminderSettingCard() {
  return (
    <FloatCard width="100%">
      <p style={{ fontSize: '9.5px', color: 'rgba(44,40,37,0.45)', marginBottom: '10px', letterSpacing: '0.05em' }}>提醒設定</p>
      {[
        ['發送時機', '服務前一天'],
        ['發送時間', '18:00'],
        ['發送方式', 'LINE 自動送出'],
      ].map(([k, v]) => (
        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderTop: '1px solid rgba(44,40,37,0.07)' }}>
          <span style={{ fontSize: '11.5px', color: 'rgba(44,40,37,0.6)' }}>{k}</span>
          <span style={{ fontSize: '12px', color: oakDeep, fontWeight: 600 }}>{v} ›</span>
        </div>
      ))}
    </FloatCard>
  )
}

/** 服務筆記輸入卡 */
export function NoteInputCard() {
  return (
    <FloatCard width="100%">
      <p style={{ fontSize: '9.5px', color: 'rgba(44,40,37,0.45)', marginBottom: '9px', letterSpacing: '0.05em' }}>新增服務筆記</p>
      <p style={{ fontSize: '12.5px', color: charcoal, lineHeight: 1.65, minHeight: '54px' }}>
        這次用 8/0 + 7/43 = 1:1，氧化劑 6%<span style={{ display: 'inline-block', width: '1.5px', height: '13px', background: oak, verticalAlign: 'middle', marginLeft: '2px' }} />
      </p>
      <div style={{ display: 'flex', gap: '6px', marginTop: '8px', alignItems: 'center' }}>
        {['photo-1634449571010-02389ed0f9b0', 'photo-1582095133179-bfd08e2fc6b3'].map(id => (
          <div key={id} style={{ width: '40px', height: '40px', borderRadius: '7px', backgroundImage: `url(${U(id, 120)})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        ))}
        <div style={{ width: '40px', height: '40px', borderRadius: '7px', border: `1px dashed ${oak}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: oak, fontSize: '16px' }}>＋</div>
        <span style={{ fontSize: '10.5px', color: 'rgba(44,40,37,0.45)', marginLeft: '2px' }}>加入照片</span>
      </div>
    </FloatCard>
  )
}

/** 本週成績單卡 — 對應 weeklyReportFlex */
export function WeeklyReportCard() {
  return (
    <FloatCard width="100%" tint="dark" pad="16px 17px">
      <p style={{ fontSize: '13.5px', fontWeight: 700, color: cream, marginBottom: '2px' }}>本週成績單</p>
      <p style={{ fontSize: '10.5px', color: 'rgba(251,249,244,0.5)', marginBottom: '12px' }}>7/21 – 7/27</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', borderTop: '1px solid rgba(166,137,102,0.25)', paddingTop: '11px' }}>
        {[['成交', '18 筆'], ['營收', 'NT$ 31,600'], ['下週已預約', '12 筆']].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
            <span style={{ color: 'rgba(251,249,244,0.55)' }}>{k}</span>
            <span style={{ color: cream, fontWeight: 600 }}>{v}</span>
          </div>
        ))}
      </div>
      <p style={{ fontSize: '10.5px', color: 'rgba(251,249,244,0.62)', lineHeight: 1.6, background: 'rgba(166,137,102,0.14)', borderRadius: '8px', padding: '9px 10px', marginTop: '12px' }}>
        本週最熱門是「染髮 + 護髮」，佔 42%
      </p>
    </FloatCard>
  )
}

/** 候補通知卡 — 對應 waitlist 功能 */
export function WaitlistCard() {
  return (
    <FloatCard width="100%">
      <p style={{ fontSize: '13px', fontWeight: 700, color: charcoal, marginBottom: '6px' }}>時段釋出通知</p>
      <p style={{ fontSize: '11.5px', color: 'rgba(44,40,37,0.65)', lineHeight: 1.6 }}>
        您候補的 <span style={{ color: oakDeep, fontWeight: 600 }}>7/28 (一) 14:00</span> 有空位了，先搶先贏。
      </p>
      <div style={{ background: oakDeep, color: '#fff', textAlign: 'center', fontSize: '11px', fontWeight: 600, padding: '8px', borderRadius: '7px', marginTop: '10px' }}>
        立即預約
      </div>
    </FloatCard>
  )
}

/** 步驟大數字 */
export function StepNum({ n }: { n: string }) {
  return (
    <span style={{
      fontFamily: '"Cormorant Garamond", serif', fontSize: '2.4rem', fontWeight: 400,
      color: oak, lineHeight: 1, display: 'block', marginBottom: '4px',
    }}>{n}</span>
  )
}

/* ────────────────────────────────────────────────────────────
   桌機視窗外框 — 讓版面出現「寬的東西」，打破整頁都是直立手機的單調
   ──────────────────────────────────────────────────────────── */
export function DesktopFrame({ children, label = 'moolah.studio/admin' }: { children: React.ReactNode; label?: string }) {
  return (
    <div style={{
      width: '100%', maxWidth: '760px',
      borderRadius: '14px', overflow: 'hidden',
      background: '#221e1b',
      boxShadow: '0 26px 60px rgba(0,0,0,0.42)',
      border: '1px solid rgba(166,137,102,0.22)',
    }}>
      {/* 視窗頂條 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: '#2a2521' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {['#e06c5a', '#e0b45a', '#7fae6a'].map(c => (
            <span key={c} style={{ width: '10px', height: '10px', borderRadius: '50%', background: c, opacity: 0.85 }} />
          ))}
        </div>
        <div style={{
          flex: 1, textAlign: 'center', fontSize: '10.5px', color: 'rgba(251,249,244,0.45)',
          background: 'rgba(0,0,0,0.24)', borderRadius: '6px', padding: '4px 10px', maxWidth: '280px', margin: '0 auto',
        }}>{label}</div>
        <div style={{ width: '42px' }} />
      </div>
      <div style={{ background: cream }}>{children}</div>
    </div>
  )
}

/** 寬版後台總覽 — 橫向佈局，和手機版形成對比 */
export function AdminDesktop() {
  const rows = [
    { time: '11:00', name: '陳小姐', svc: '洗剪造型', min: 60, state: '已完成' },
    { time: '14:00', name: '王小姐', svc: '染髮 + 護髮', min: 180, state: '下一位' },
    { time: '17:30', name: '林先生', svc: '深層護髮', min: 45, state: '' },
    { time: '19:00', name: '黃小姐', svc: '洗剪造型', min: 60, state: '' },
  ]
  return (
    <div className="admin-desk">
      {/* 左：今日預約列表 */}
      <div style={{ background: cream, padding: '18px 18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '14px' }}>
          <p style={{ fontSize: '13.5px', fontWeight: 700, color: charcoal }}>今日預約</p>
          <span style={{ fontSize: '11px', color: 'rgba(44,40,37,0.5)' }}>7 月 28 日（一）</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
          {rows.map(r => {
            const next = r.state === '下一位'
            return (
              <div key={r.time} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                background: next ? charcoalDeep : '#fff',
                borderRadius: '10px', padding: '11px 13px',
                border: next ? 'none' : '1px solid rgba(44,40,37,0.07)',
              }}>
                <span style={{
                  fontFamily: '"Cormorant Garamond", serif', fontSize: '17px', flexShrink: 0, width: '52px',
                  color: next ? cream : charcoal,
                }}>{r.time}</span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ fontSize: '12.5px', fontWeight: 600, color: next ? cream : charcoal }}>{r.name}・{r.svc}</p>
                  <p style={{ fontSize: '10.5px', color: next ? 'rgba(251,249,244,0.5)' : 'rgba(44,40,37,0.45)', marginTop: '2px' }}>{r.min} 分鐘</p>
                </div>
                {r.state && (
                  <span style={{
                    flexShrink: 0, fontSize: '9.5px', fontWeight: 700, padding: '3px 9px', borderRadius: '99px',
                    background: next ? oak : 'rgba(120,150,110,0.16)',
                    color: next ? '#231f1b' : '#4a6b41',
                  }}>{next ? '下一位 · 還有 25 分' : r.state}</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 右：統計 */}
      <div style={{ background: '#f6f1e8', padding: '18px 18px 20px' }}>
        <p style={{ fontSize: '13.5px', fontWeight: 700, color: charcoal, marginBottom: '14px' }}>營運概況</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
          {[
            { l: '今日預約', v: '4', u: '筆', p: true },
            { l: '今日營收', v: '6,800', u: 'NT$' },
            { l: '本月預約', v: '31', u: '筆' },
            { l: '本月營收', v: '52,400', u: 'NT$' },
          ].map(x => (
            <div key={x.l} style={{
              background: x.p ? charcoalDeep : '#fff', borderRadius: '10px', padding: '12px 11px',
              border: x.p ? 'none' : '1px solid rgba(44,40,37,0.07)',
            }}>
              <p style={{ fontSize: '10px', color: x.p ? 'rgba(251,249,244,0.7)' : 'rgba(44,40,37,0.6)', marginBottom: '5px', whiteSpace: 'nowrap' }}>{x.l}</p>
              <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '22px', lineHeight: 1, color: x.p ? cream : oak }}>
                {x.v}<span style={{ fontSize: '9.5px', marginLeft: '3px', color: 'rgba(166,137,102,0.75)' }}>{x.u}</span>
              </p>
            </div>
          ))}
        </div>
        <div style={{ background: '#fff', borderRadius: '10px', padding: '12px 13px', border: '1px solid rgba(44,40,37,0.07)' }}>
          <p style={{ fontSize: '10px', color: 'rgba(44,40,37,0.5)', marginBottom: '8px' }}>本週最熱門</p>
          <p style={{ fontSize: '12.5px', fontWeight: 700, color: charcoal, marginBottom: '8px' }}>染髮 + 護髮</p>
          <div style={{ height: '6px', borderRadius: '99px', background: 'rgba(44,40,37,0.08)', overflow: 'hidden' }}>
            <div style={{ width: '42%', height: '100%', background: oak }} />
          </div>
          <p style={{ fontSize: '10.5px', color: oakDeep, marginTop: '6px', fontWeight: 600 }}>佔 42%</p>
        </div>
      </div>

      {/* 窄螢幕時堆疊成單欄，不然兩欄會擠在一起 */}
      <style>{`
        .admin-desk { display: grid; grid-template-columns: 1fr; gap: 1px; background: rgba(44,40,37,0.08); }
        @media (min-width: 640px) {
          .admin-desk { grid-template-columns: minmax(0,1.25fr) minmax(0,1fr); }
        }
      `}</style>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────
   放大的 LINE 對話 — 不用手機框，直接把訊息卡放大（客立樂的做法）
   ──────────────────────────────────────────────────────────── */
export function ChatBubbleBig() {
  return (
    <div style={{ width: '100%', maxWidth: '380px' }}>
      <p style={{
        fontSize: '11px', color: 'rgba(44,40,37,0.5)', background: 'rgba(44,40,37,0.06)',
        borderRadius: '99px', padding: '5px 14px', width: 'fit-content', margin: '0 auto 16px',
      }}>
        服務前一天 18:00・助理自動送出
      </p>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        <div style={{
          width: '38px', height: '38px', borderRadius: '50%', background: charcoalDeep, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: oak,
          fontSize: '15px', fontFamily: '"Cormorant Garamond", serif',
        }}>M</div>
        <div style={{
          background: '#fff', borderRadius: '18px', padding: '20px 20px 18px', minWidth: 0, flex: 1,
          boxShadow: '0 18px 44px rgba(26,23,20,0.16)', border: `1px solid ${oak}22`,
        }}>
          <p style={{ fontSize: '18px', fontWeight: 700, color: charcoal, marginBottom: '6px' }}>✨ 預約提醒</p>
          <p style={{ fontSize: '13px', color: 'rgba(44,40,37,0.62)', lineHeight: 1.6, marginBottom: '14px' }}>
            別忘了，明天有一筆預約等著您 🙏
          </p>
          <div style={{ borderTop: '1px solid rgba(44,40,37,0.1)', paddingTop: '13px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
            {[['預約日期', '7/28（一）'], ['預約時段', '14:00'], ['服務項目', '染髮 + 護髮'], ['服務店家', 'Studio Aurelia']].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', gap: '14px', fontSize: '13px' }}>
                <span style={{ color: 'rgba(44,40,37,0.45)', width: '62px', flexShrink: 0 }}>{k}</span>
                <span style={{ color: charcoal, fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{
            background: oakDeep, color: '#fff', textAlign: 'center', fontSize: '13px',
            fontWeight: 600, padding: '11px', borderRadius: '9px', marginTop: '16px',
          }}>
            查看 / 管理預約
          </div>
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────
   客戶資料卡群 — 散佈式，不用手機框
   ──────────────────────────────────────────────────────────── */
export function CustomerCardsScatter() {
  return (
    <div style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* 主卡：客戶檔案 */}
      <div style={{
        background: '#fff', borderRadius: '18px', padding: '20px',
        boxShadow: '0 18px 44px rgba(0,0,0,0.3)', border: `1px solid ${oak}22`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '15px' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '50%', flexShrink: 0,
            backgroundImage: `url(${U('photo-1675034743339-0b0747047727', 200)})`, backgroundSize: 'cover', backgroundPosition: 'center',
            border: `2px solid ${oak}`,
          }} />
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: '16px', fontWeight: 700, color: charcoal }}>王小姐</p>
            <p style={{ fontSize: '11.5px', color: 'rgba(44,40,37,0.5)', marginTop: '2px' }}>累計到訪 6 次・上次 5/12</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['細軟髮質', '偏好自然棕', '會提早到'].map(t => (
            <span key={t} style={{ fontSize: '11px', color: oakDeep, border: `1px solid ${oak}55`, borderRadius: '99px', padding: '5px 11px' }}>{t}</span>
          ))}
        </div>
      </div>

      {/* 副卡：這次的筆記（偏移做出層次） */}
      <div style={{
        background: '#fff', borderRadius: '16px', padding: '17px 18px',
        boxShadow: '0 14px 36px rgba(0,0,0,0.26)', border: `1px solid ${oak}22`,
        marginLeft: '28px',
      }}>
        <p style={{ fontSize: '10.5px', color: 'rgba(44,40,37,0.45)', marginBottom: '7px', letterSpacing: '0.04em' }}>這次的服務筆記</p>
        <p style={{ fontSize: '13.5px', color: charcoal, lineHeight: 1.7 }}>
          8/0 + 7/43 = 1:1，氧化劑 6%<br />
          染後用護色洗，客人說很滿意
        </p>
        <div style={{ display: 'flex', gap: '7px', marginTop: '13px' }}>
          {['photo-1634449571010-02389ed0f9b0', 'photo-1582095133179-bfd08e2fc6b3', 'photo-1634449571017-5fecfd26ad76'].map(id => (
            <div key={id} style={{
              width: '54px', height: '54px', borderRadius: '9px',
              backgroundImage: `url(${U(id, 160)})`, backgroundSize: 'cover', backgroundPosition: 'center',
            }} />
          ))}
          <div style={{
            width: '54px', height: '54px', borderRadius: '9px', border: `1px dashed ${oak}66`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: oak, fontSize: '20px',
          }}>＋</div>
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────
   場景容器 — 情境照背景 + 內容浮層
   ──────────────────────────────────────────────────────────── */
/**
 * @param sideScrim 只在「文字所在的區域」加遮罩，讓照片其餘部分維持原本的清晰明亮。
 *   整片垂直遮罩壓到白字可讀 → 會把整張照片一起悶成灰的。
 *   改法：底層 overlay 壓到很低（照片清楚），可讀性交給這層局部遮罩。
 *   桌機＝左深右淺（文字在左欄）；手機＝上深下淺（文字在上方）。切換寫在 page.tsx 的 CSS。
 */
export function Scene({
  photo, photoMobile, children, overlay = 0.72, minHeight = 'auto', id, sideScrim = false, bandOnMobile = false,
}: { photo?: string; photoMobile?: string; children: React.ReactNode; overlay?: number; minHeight?: string; id?: string; sideScrim?: boolean; bandOnMobile?: boolean }) {
  /**
   * ⚠️ 手機「背景圖被放大到看不出是什麼」的根因是版面數學，不是圖：
   *   3:2 橫圖用 background-size:cover 塞進 390×900 的直式容器 →
   *   為了填滿高度會放大到 1350px 寬，只看得到中間 29%＝變成臉部特寫。
   * 兩道解：
   *   ① photoMobile 給一張 2:3 直式圖（比例貼近手機容器）→ CSS 在 <900px 換上。
   *   ② bandOnMobile 把背景圖限制在區塊上方一段（不隨超長內容一起拉高）→
   *      容器比例才不會失控；下方漸層淡入純色，內容照樣讀得清楚。
   */
  const bgVars = {
    ['--bg' as string]: photo ? `url(${photo})` : undefined,
    ['--bg-m' as string]: `url(${photoMobile || photo})`,
  } as React.CSSProperties

  return (
    <section id={id} style={{ position: 'relative', overflow: 'hidden', background: charcoalDeep, minHeight }}>
      {photo && (
        <div className={`scene-bg${bandOnMobile ? ' scene-bg-band' : ''}`} style={bgVars} aria-hidden>
          <div className="scene-bg-img" />
          {/*
            遮罩：只壓到「白字讀得清楚」為止，不要把照片悶死。
            原本是 overlay → +0.14 → 固定 0.96（底部幾乎全黑）＝ 照片等於白放。
            改成跟著 overlay 等比加深、且封頂 0.9，讓底部仍看得見場景。
          */}
          <div style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(to bottom, rgba(26,23,20,${overlay}) 0%, rgba(26,23,20,${Math.min(overlay + 0.08, 0.88)}) 60%, rgba(26,23,20,${Math.min(overlay + 0.16, 0.9)}) 100%)`,
          }} />
          {sideScrim && <div className="scene-side-scrim" />}
          {bandOnMobile && <div className="scene-bg-fade" />}
        </div>
      )}
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </section>
  )
}

/** 場景標題 — 大字壓在照片上 */
export function SceneTitle({ kicker, title, sub, tone = 'light' }: { kicker?: string; title: React.ReactNode; sub?: string; tone?: 'light' | 'dark' }) {
  const light = tone === 'light'
  return (
    // 容器寬度與場景內容（.sc）對齊，內文再自行限制閱讀行長
    <div style={{ padding: '46px 22px 22px', maxWidth: '1260px', margin: '0 auto' }}>
      {kicker && (
        <p style={{ fontSize: '12px', color: oak, fontWeight: 700, marginBottom: '10px', letterSpacing: '0.02em' }}>{kicker}</p>
      )}
      <h2 style={{
        fontFamily: '"Cormorant Garamond", serif',
        fontSize: 'clamp(1.9rem, 7.5vw, 2.8rem)', fontWeight: 400, lineHeight: 1.22,
        color: light ? cream : charcoal, marginBottom: sub ? '12px' : 0,
        letterSpacing: '-0.01em', /* 標題斷行一律用 <br /> 控制；ch 單位對中文 fallback 會誤傷 */
      }}>
        {title}
      </h2>
      {sub && (
        <p style={{ fontSize: 'clamp(14px, 4vw, 15.5px)', lineHeight: 1.8, maxWidth: '46ch', color: light ? 'rgba(251,249,244,0.82)' : 'rgba(44,40,37,0.88)' }}>
          {sub}
        </p>
      )}
    </div>
  )
}

/** 畫面示意標註 — 誠實標示 mockup 用的示範資料 */
export function MockNote({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  return (
    <p style={{
      fontSize: '10.5px', textAlign: 'center', marginTop: '16px',
      color: tone === 'light' ? 'rgba(251,249,244,0.38)' : 'rgba(44,40,37,0.38)',
    }}>
      畫面示意，客戶姓名與數字為示範資料
    </p>
  )
}
