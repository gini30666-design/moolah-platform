import type { Metadata } from 'next'
import JoinForm from '@/components/JoinForm'
import SiteFooter from '@/components/SiteFooter'
import StickyTrialCTA from '@/components/StickyTrialCTA'
import TrackedLineLink from '@/components/TrackedLineLink'
import ScrollDepthTracker from '@/components/ScrollDepthTracker'
import { LINE_B2B_URL } from '@/lib/lineOA'
import IndustryPicker from './IndustryPicker'
import StepPhones from './StepPhones'
import {
  SCENE_PHOTOS, HandDrawnCurve, CURVES, Annotation, PhoneFrame,
  LockScreenNotifs, ReminderChat, CustomerCard, AdminToday,
  Scene, SceneTitle, MockNote,
  NewBookingCard, ReminderSettingCard, NoteInputCard, WaitlistCard, StepNum,
  DesktopFrame, AdminDesktop, ChatBubbleBig, CustomerCardsScatter,
} from './StoryScenes'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://moolah-platform.vercel.app'
const oak = '#A68966'
const charcoal = '#2C2825'
const charcoalDeep = '#1a1714'
const cream = '#fbf9f4'
const LINE_URL = LINE_B2B_URL
const DEMO_URL = '/designer-003'

// ⚠️ 廣告專用落地頁 — noindex（不進 Google 索引，避免與 /for-providers SEO 頁重複內容互打）
export const metadata: Metadata = {
  // ⚠️ 標題必須含「預約系統」字面：Google Ads 的「到達網頁體驗」是拿搜尋字詞跟頁面主題比對，
  //    2026-08-02 診斷出全帳戶 24 個關鍵字皆 BELOW_AVERAGE，根因就是這頁通篇只講「AI 接單助理」，
  //    Google 讀不出它是「預約系統」→ QS 掉到 3 → CPC 衝到 NT$44。定位不變，只是把字面補回來。
  title: '美業預約系統 × AI 接單助理 | MooLah 14 天免費試用',
  description: '專為美業職人打造的 LINE 線上預約系統。會用 LINE 就會用，不必學新軟體，客人免下載 App。24 小時自動接單、提醒客人、記住每位客人的細節。0 抽佣、不綁約、14 天免費試用。',
  robots: { index: false, follow: false },
  alternates: { canonical: `${BASE_URL}/pro` },
}

/** 常見問題 — 答案必須與 lib/plan.ts 的實際方案一致（699／14 天 30 筆／0 抽佣／不綁約） */
const FAQ: { q: string; a: string }[] = [
  { q: '我的客人需要下載 App 嗎？', a: '不用。整個預約流程都在 LINE 裡完成，客人免下載、免註冊、免加入會員，點開就能選服務和時段。' },
  { q: '會抽成嗎？', a: '不抽成。MooLah 只收月費 NT$699，客人付你多少，全部都是你的，系統不從中抽任何一毛。' },
  { q: '要綁約嗎？想停可以嗎？', a: '不綁約、沒有解約金，隨時可以停用。停用後資料還會保留 30 天，之後想回來也接得上。' },
  { q: '免費試用有什麼限制？', a: '14 天內全功能開放，預約筆數上限 30 筆。試用期間不需要提供信用卡，也不會自動扣款。' },
  { q: 'MooLah 是預約系統嗎？', a: '是。MooLah 是專為美業職人設計的線上預約系統，跑在 LINE 上面：客人在 LINE 裡選服務、挑時段、送出預約，系統自動鎖時段、自動發提醒，你在後台就能看到所有預約。' },
  { q: '我不太會用電腦或軟體，可以嗎？', a: '可以。你只要會用 LINE 就會用 MooLah——所有操作都在 LINE 裡，沒有另外的軟體要安裝、沒有新介面要背。加 LINE 之後由專人一對一帶你設定，服務項目、時段、作品集都幫你弄好，通常 30 分鐘內就能開始接單。' },
  { q: '我本來就用 LINE 官方帳號接預約，要重新來過嗎？', a: '不用。你原本的接單習慣完全不變，只是把「客人傳訊息問、你一則一則回」換成「客人自己點開選時段」。現有客人不需要重新加好友或重新輸入資料，也不必下載任何 App——等於零成本、零風險轉換，不合用隨時停掉就好。' },
  { q: '我要怎麼讓現有客人開始線上預約？', a: '開通後你會拿到一個專屬預約連結，貼在 IG 個人簡介或 LINE 訊息裡就能用。另外會免費附一張客製立牌，放店裡讓客人掃碼。' },
  { q: '沒有實體店面也能用嗎？', a: '可以。個人工作室、在家接案、到府服務都適用，系統不需要你有店面或櫃檯。' },
  { q: '資料安全嗎？', a: '客戶資料存放在雲端資料庫（東京機房），只有你本人透過 LINE 身分登入後台才看得到。系統本身也會擋掉同一時段的重複預約。' },
  { q: '一個月多少錢？', a: 'NT$699／月，先 14 天免費試用，滿意再開始付費。工作室或多人團隊可另外洽詢報價。' },
  { q: 'MooLah 是誰做的？', a: 'MooLah 由台灣的永翔數位有限公司（統一編號 62130226）開發與營運，總部設於屏東縣。' },
]

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
}

function LineIcon({ size = 20 }: { size?: number }) {
  return <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: size, height: size }}><path d="M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
}

/** 每個說服段落結束都給一次行動機會（客立樂的作法） */
function CtaBar({ source, label = '加 LINE 開通免費試用', pad = '30px 22px 40px' }: { source: string; label?: string; pad?: string }) {
  return (
    <div style={{ padding: pad, maxWidth: '520px', margin: '0 auto' }}>
      <TrackedLineLink href={LINE_URL} source={source} className="cta-btn"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: '#06C755', color: '#fff', padding: '16px 24px', borderRadius: '13px', fontSize: '15.5px', fontWeight: 700, textDecoration: 'none', boxShadow: '0 8px 24px rgba(6,199,85,0.28)' }}>
        <LineIcon size={19} /> {label}
      </TrackedLineLink>
    </div>
  )
}

/**
 * 場景版面 CSS。
 * 每個場景刻意用不同的佈局（手機在左/在右/切出邊緣/純卡片散佈），
 * 避免「每屏都是一支置中手機」的單調感。
 * 手機視窗（<760px）塌成單欄，但保留左右錯位與尺寸落差維持節奏。
 */
const SCENE_CSS = `
.sc { max-width: 1260px; margin: 0 auto; padding: 0 22px; }

/* 手機在右、卡片在左 */
.sc-split { display: grid; gap: 26px; align-items: center; }
.sc-split .aside { display: flex; flex-direction: column; gap: 20px; }
.sc-split .stage { display: flex; justify-content: center; position: relative; }

/* 三步驟已抽成 StepPhones.tsx（含自帶 CSS 與互動）*/

/* 純卡片散佈 */
.sc-scatter { display: grid; gap: 16px; }

/* 浮動小卡的通用寬度 */
.floaty { width: 100%; max-width: 268px; }

/*
  場景背景層。
  ⚠️ 手機預設吃 --bg-m（2:3 直式圖）；桌機 ≥900px 才換回 --bg（3:2 橫式圖）。
     原因：橫圖用 cover 塞進手機的直式容器會放大到看不出內容（只剩中間 ~29%）。
*/
.scene-bg { position: absolute; inset: 0; pointer-events: none; }
.scene-bg-img {
  position: absolute; inset: 0;
  background-image: var(--bg-m); background-size: cover; background-position: center;
}
@media (min-width: 900px) { .scene-bg-img { background-image: var(--bg); } }

/*
  bandOnMobile：內容很長的場景區塊在手機上會被拉到 2000px 以上，
  背景圖跟著撐高就又被放大。→ 手機把背景限制在上方一段（比例才控制得住），
  下緣漸層淡入區塊底色，內容區維持純深色、字好讀。
*/
@media (max-width: 899px) {
  .scene-bg-band { bottom: auto; height: 78svh; }
  .scene-bg-fade {
    position: absolute; left: 0; right: 0; bottom: 0; height: 26%;
    background: linear-gradient(to bottom, rgba(26,23,20,0) 0%, rgba(26,23,20,0.72) 55%, #1a1714 100%);
  }
}
@media (min-width: 900px) { .scene-bg-fade { display: none; } }

/*
  文字區局部遮罩（<Scene sideScrim>）。
  目的：照片本身要清楚明亮，只在「壓字的地方」加暗，而不是整張蓋一層灰。
  手機＝文字在上方 → 上深下淺，下半部（人物、平板）完全不遮。
  桌機＝文字在左欄 → 左深右淺（見 @media ≥900px 覆寫）。
*/
.scene-side-scrim {
  display: block; position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(to bottom,
    rgba(26,23,20,0.74) 0%,
    rgba(26,23,20,0.58) 26%,
    rgba(26,23,20,0.22) 48%,
    rgba(26,23,20,0) 66%);
}

/* Hero：手機為單欄置中，桌機轉成左文右圖的不對稱編排 */
.hero-wrap { max-width: 1320px; margin: 0 auto; padding: 18px 24px 40px; }
.hero-copy { text-align: center; }
.hero-stage { display: flex; justify-content: center; margin: 26px 0 28px; }
.hero-chips { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
/* CTA 不隨容器無限拉寬 */
.cta-btn { max-width: 420px; margin-left: auto; margin-right: auto; }
/* 同一張產品畫面在手機／桌機各放一次，只顯示對應的那個 */
.only-desktop { display: none; }
.only-mobile  { display: flex; }

/* 大留白場景：刻意給更多呼吸空間，跟前後密集的段落形成節奏對比 */
.scene-airy { padding-top: 26px; padding-bottom: 34px; }
@media (min-width: 900px) { .scene-airy { padding-top: 56px; padding-bottom: 72px; } }

/* 差異化配圖卡：照片上壓數字，文字在照片下方 */
.diff-grid { display: grid; gap: 22px; padding: 26px 0 8px; }
.diff-card { margin: 0; }
.diff-photo { position: relative; border-radius: 16px; overflow: hidden; aspect-ratio: 4 / 3; }
.diff-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
.diff-veil {
  position: absolute; inset: 0;
  background: linear-gradient(to top, rgba(26,23,20,0.88) 0%, rgba(26,23,20,0.35) 55%, rgba(26,23,20,0.12) 100%);
}
.diff-photo figcaption {
  position: absolute; left: 0; right: 0; bottom: 0; padding: 18px 18px 16px;
  display: flex; align-items: baseline; gap: 10px;
}
.diff-big {
  font-family: "Cormorant Garamond", serif; font-size: 2.5rem; font-weight: 500;
  color: #fbf9f4; line-height: 1; letter-spacing: -0.01em;
}
.diff-label { font-size: 13.5px; font-weight: 700; color: #D9BE95; }
@media (min-width: 700px) { .diff-grid { grid-template-columns: repeat(2, 1fr); gap: 26px 24px; } }
@media (min-width: 1000px) { .diff-grid { grid-template-columns: repeat(4, 1fr); gap: 22px; } .diff-big { font-size: 2.1rem; } }

@media (min-width: 900px) {
  /*
    桌機改成左深右淺：文字在左欄，只暗化左半邊；
    58% 之後完全透明 → 人物、窗光、平板維持照片原本的清晰明亮。
  */
  .scene-side-scrim {
    background: linear-gradient(to right,
      rgba(26,23,20,0.80) 0%,
      rgba(26,23,20,0.62) 22%,
      rgba(26,23,20,0.24) 42%,
      rgba(26,23,20,0) 58%);
  }

  /* 桌機 hero：左文右圖，不再是置中窄欄 */
  .hero-wrap {
    /* 右欄收窄：讓 hero 照片右半（客人、平板、窗光）不要整片被手機蓋掉 */
    display: grid; grid-template-columns: 1fr 0.68fr; gap: 44px;
    align-items: center; padding: 10px 24px 56px;
    min-height: 78svh; /* 撐滿首屏，避免內容擠在上緣、下方大片空白 */
  }
  .hero-copy { text-align: left; }
  .hero-stage { margin: 0; justify-content: flex-end; }
  .hero-chips { justify-content: flex-start; }
  /* 只有 hero 的 CTA 靠左；其他區塊的 CTA 維持置中 */
  .hero-copy .cta-btn { margin-left: 0; }
  .hero-sub-links { text-align: left; }
  .only-desktop { display: flex; }
  .only-mobile  { display: none; }
  /* Hero 手機微傾 + 縱深 */
  .hero-tilt {
    transform: perspective(1400px) rotateY(-9deg) rotateX(2deg) rotate(-1.5deg);
    transition: transform .6s cubic-bezier(0.16,1,0.3,1);
  }
  .hero-tilt:hover { transform: perspective(1400px) rotateY(-4deg) rotate(0deg); }
}
@media (prefers-reduced-motion: reduce) {
  .hero-tilt { transform: none !important; }
}

@media (min-width: 760px) {
  .sc-split { grid-template-columns: 1fr 1fr; gap: 40px; }
  .sc-split.reverse .aside { order: 2; }
  .sc-split.reverse .stage { order: 1; }
  /* 手機刻意往外推、切出視覺邊界 */
  .sc-split .stage.bleed-right { justify-content: flex-start; transform: translateX(6%); }
  .sc-split .stage.bleed-left  { justify-content: flex-end;   transform: translateX(-6%); }
  .sc-scatter { grid-template-columns: repeat(12, 1fr); align-items: start; gap: 26px 24px; }
  /* 寬版後台橫跨大半版面，兩句標註分列左右 */
  .sc-scatter .wide   { grid-column: 1 / 10; }
  .sc-scatter .note-l { grid-column: 10 / 13; align-self: center; }
  .sc-scatter .note-r { grid-column: 3 / 9; transform: translateY(10px); }
}

@media (max-width: 759px) {
  /* 單欄時：主角（手機畫面）永遠先出現，卡片與標註跟在後面 */
  .sc-split .stage { order: -1; margin-bottom: 4px; }
  /* 左右錯位製造節奏，而不是全部置中 */
  .sc-split .aside { padding: 0 4px; }
  .sc-split .stage.bleed-right { transform: translateX(7%); }
  .sc-split .stage.bleed-left  { transform: translateX(-7%); }



  .floaty.shift-r { margin-left: auto; }
  .floaty.shift-l { margin-right: auto; }
}

@media (prefers-reduced-motion: reduce) {
  .sc-split .stage, .sc-scatter > * { transform: none !important; }
}
`

export default function ProLandingPage() {
  return (
    <>
      <ScrollDepthTracker label="pro" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <style dangerouslySetInnerHTML={{ __html: SCENE_CSS }} />
      {/*
        ⚠️ 用 overflow-x: clip，不要用 hidden。
        CSS 規範下 overflow-x:hidden 會把 overflow-y 算成 auto，
        main 就變成第二個捲動容器 → 右側出現兩條滾軸、滑動時第一下卡住。
        clip 只裁切、不建立捲動容器。
      */}
      <main style={{ background: cream, color: charcoal, overflowX: 'clip' }}>

        {/* ══════════ HERO ══════════ */}
        {/*
          Hero 背景＝自家生成的原創圖（public/pro-hero.jpg，2400×1600 3:2）。
          不用圖庫/Pinterest 圖＝零授權風險。
          overlay 只留 0.18：幾乎不蓋 —— 照片維持原本的清晰明亮，這是它被選中的理由。
          白字可讀性全部交給 sideScrim（只暗化文字所在區域：桌機左欄／手機上方）。
        */}
        <Scene photo="/pro-hero.jpg" photoMobile="/pro-hero-m.jpg" overlay={0.18} minHeight="96svh" sideScrim>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 22px' }}>
            <span style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '20px', letterSpacing: '0.18em', color: cream }}>MOOLAH</span>
            <span style={{ fontSize: '11px', color: 'rgba(251,249,244,0.6)' }}>獨立美業職人的 AI 接單助理</span>
          </div>

          <div className="hero-wrap">
            <div className="hero-copy">
              <h1 style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 300, fontSize: 'clamp(2rem, 7.4vw, 3.5rem)', lineHeight: 1.2, letterSpacing: '-0.015em', color: cream, marginBottom: '18px' }}>
                你在服務客人時<br />誰幫你接單
              </h1>
              <p style={{ fontSize: 'clamp(15px, 4.2vw, 17px)', lineHeight: 1.8, color: 'rgba(251,249,244,0.85)', marginBottom: '26px' }}>
{/* ⚠️ 定位鐵律（2026-08-03 Gini 拍板）：人眼讀到的第一句**不放「預約系統」**。
    那是既有品類名，用了就被歸進客立樂/folio/夯客的抽屜 → 進功能比較戰 → 必輸。
    Google 的到達網頁體驗看的是整頁文本，metadata title + FAQ + 下方段落有就夠了。 */}
MooLah 是專為獨立美業職人打造的<br />
                <strong style={{ color: cream, fontWeight: 700 }}>AI 接單助理</strong>——<br />
                幫你收預約、提醒客人、記住每個人的細節。<br />
                <span style={{ color: oak, fontWeight: 700 }}>你只要專心做手藝。</span>
              </p>

              {/* 手機版：畫面接在文案後面；桌機版由 grid 移到右欄 */}
              <div className="hero-stage only-mobile">
                <PhoneFrame width={216}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/pro-screen-1.jpg" alt="MooLah 預約頁：客人選服務與價格" width={390} height={844} style={{ width: "100%", display: "block", aspectRatio: "390 / 844", objectFit: "cover" }} />
                </PhoneFrame>
              </div>

              <TrackedLineLink href={LINE_URL} source="pro_hero"
                className="cta-btn"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: '#06C755', color: '#fff', padding: '18px 24px', borderRadius: '14px', fontSize: '16px', fontWeight: 700, textDecoration: 'none', boxShadow: '0 8px 26px rgba(6,199,85,0.4)', marginBottom: '14px' }}>
                <LineIcon /> 加 LINE 開通免費試用
              </TrackedLineLink>
              <div className="hero-sub-links" style={{ textAlign: 'center', marginBottom: '24px' }}>
                <a href={DEMO_URL} style={{ display: 'inline-block', fontSize: '13px', color: 'rgba(251,249,244,0.72)', textDecoration: 'underline', textUnderlineOffset: '4px' }}>
                  先看系統示範頁 →
                </a>
              </div>

              <div className="hero-chips">
                {['會用 LINE 就會用', '14 天免費試用', '0 抽佣', '不綁約', '免下載 App'].map(t => (
                  <span key={t} style={{ fontSize: '12px', color: 'rgba(251,249,244,0.88)', padding: '7px 14px', borderRadius: '99px', border: '1px solid rgba(166,137,102,0.45)', background: 'rgba(166,137,102,0.12)' }}>{t}</span>
                ))}
              </div>
            </div>

            {/* 桌機右欄的產品畫面 — 放大並微傾，做出縱深、不只是「貼一支手機」 */}
            <div className="hero-stage only-desktop">
              <div className="hero-tilt">
                <PhoneFrame width={264}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/pro-screen-1.jpg" alt="MooLah 預約頁：客人選服務與價格" width={390} height={844} style={{ width: "100%", display: "block", aspectRatio: "390 / 844", objectFit: "cover" }} />
                </PhoneFrame>
              </div>
            </div>
          </div>
        </Scene>

        {/*
          ══════════ 產業分眾（緊接 Hero）══════════
          刻意放第二屏：這是「自我識別鉤子」——職人先看到自己的產業，
          才會覺得「這是為我做的」而繼續往下看。後面的功能場景就變成佐證。
        */}
        <section data-animate style={{ background: '#ffffff', color: charcoal, padding: '10px 0 48px' }}>
          <SceneTitle
            tone="dark"
            kicker="不同產業，不同接法"
            title={<>你的產業<br />它有自己的接法</>}
            sub="剪髮和燙染差三倍時長、大型犬和小型犬不同工時、療程要追蹤膚況——選你的產業，看它怎麼幫你顧。"
          />
          <IndustryPicker />
          <CtaBar source="pro_industry" pad="30px 22px 0" />
        </section>

        {/* ══════════ 場景 1：24 小時自動接單 ══════════ */}
        {/* overlay 從 0.74 降到 0.44 + 局部遮罩：照片要看得清楚（紀實感是重點），不是拿來當灰底 */}
        <Scene photo={SCENE_PHOTOS.working} photoMobile={SCENE_PHOTOS.workingMobile} overlay={0.28} sideScrim bandOnMobile>
          <SceneTitle
            kicker="24 小時自動接單"
            title={<>你手上在忙<br />它替你把單接好</>}
            sub="不用停下手邊的服務去回訊息。客人半夜約、上班時間約、你休假時約——它都替你收好，排進正確的時段裡。"
          />

          {/*
            進場：手機（左欄）從左、說明（右欄）從右，各自從自己那側靠攏 →「畫面被組起來」的感覺。
            ⚠️ data-animate 不能直接掛 .stage：.stage.bleed-* 本身用 transform 做出血偏移，
               會被 .will-animate 的 transform 覆蓋，且 .in-view 的 transform:none 會永久清掉出血。
               → 一律包一層內層 div 承載動畫。
          */}
          <div className="sc">
            <div className="sc-split reverse">
              <div className="aside" data-animate data-dir="right" data-delay="140">
                <div>
                  <Annotation>一整晚累積的預約，<br />早上打開就在那</Annotation>
                  <HandDrawnCurve d={CURVES.swoopRight} width={92} height={54} style={{ marginTop: '2px', marginLeft: '-4px' }} />
                </div>
                {/* 從手機裡「拉出來放大」的那張卡 */}
                <div className="floaty shift-r">
                  <NewBookingCard />
                </div>
                <div>
                  <HandDrawnCurve d={CURVES.hookDown} width={74} height={52} flip style={{ marginBottom: '-2px', marginLeft: '10px' }} />
                  <Annotation>點一下就能打給客人，<br />不用再翻對話紀錄</Annotation>
                </div>
              </div>

              <div className="stage bleed-right">
                <div data-animate data-dir="left">
                  <PhoneFrame width={228}>
                    <LockScreenNotifs />
                  </PhoneFrame>
                </div>
              </div>
            </div>
          </div>
          <MockNote />
          <CtaBar source="pro_scene1" pad="24px 22px 44px" />
        </Scene>

        {/* ══════════ 場景 2：客人自己選、自己約 ══════════ */}
        <section style={{ background: cream }}>
          <SceneTitle
            tone="dark"
            kicker="客人端"
            title={<>選服務挑時段<br />三步就約完</>}
            sub="全程在 LINE 裡完成，免下載 App、免註冊帳號。滿的時段自動鎖起來，不會被重複預約。"
          />
          <div className="sc" data-animate>
            <StepPhones />
          </div>
          <div style={{ textAlign: 'center', padding: '22px 24px 0' }}>
            <a href={DEMO_URL} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: charcoalDeep, color: cream, padding: '14px 28px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, textDecoration: 'none' }}>
              親手體驗系統示範頁 →
            </a>
            <p style={{ fontSize: '11px', color: 'rgba(44,40,37,0.42)', marginTop: '10px' }}>示範帳號，作品為情境示意圖</p>
          </div>
          <CtaBar source="pro_scene2" pad="30px 22px 46px" />
        </section>

        {/* ══════════ 場景 3：自動提醒，減少放鳥 ══════════ */}
        <section style={{ background: '#f0eae0' }}>
          <SceneTitle
            tone="dark"
            kicker="自動提醒"
            title={<>前一天自動發<br />你不用開口催</>}
            sub="它會在服務前一天替你送出提醒，客人點一下就能確認或改期。少一次白等，就多一個時段能做生意。"
          />
          <div className="sc">
            <div className="sc-split">
              {/* 這一屏刻意不用手機框：訊息卡直接放大，跟前後的手機畫面拉開差異 */}
              <div className="stage bleed-left">
                <div data-animate data-dir="left">
                  <ChatBubbleBig />
                </div>
              </div>

              <div className="aside" data-animate data-dir="right" data-delay="140">
                <div>
                  <HandDrawnCurve d={CURVES.hookDown} width={74} height={54} color={oak} style={{ marginBottom: '-2px' }} />
                  <Annotation tone="dark">時間到自動送出，<br />不用你記得</Annotation>
                </div>
                <div className="floaty">
                  <ReminderSettingCard />
                </div>
                <div>
                  <HandDrawnCurve d={CURVES.swoopRight} width={88} height={50} color={oak} flip style={{ marginBottom: '-2px' }} />
                  <Annotation tone="dark">有人取消，候補的<br />客人自動收到通知</Annotation>
                </div>
                <div className="floaty shift-r">
                  <WaitlistCard />
                </div>
              </div>
            </div>
          </div>
          <MockNote tone="dark" />
          <CtaBar source="pro_scene3" pad="26px 22px 46px" />
        </section>

        {/* ══════════ 場景 4：客戶筆記與作品歷史 ══════════ */}
        <Scene photo={SCENE_PHOTOS.styling} photoMobile={SCENE_PHOTOS.stylingMobile} overlay={0.28} sideScrim bandOnMobile>
          <SceneTitle
            kicker="客戶管理"
            title={<>上次的配方<br />下次點開就有</>}
            sub="每位客人的偏好、禁忌、上次做了什麼、用了什麼配方，連同照片它都幫你記著。她一預約，該注意的就跳出來。"
          />
          <div className="sc">
            <div className="sc-split reverse">
              <div className="aside" data-animate data-dir="right" data-delay="140">
                <div>
                  <Annotation>標籤自己定，<br />她一預約就跳出來</Annotation>
                  <HandDrawnCurve d={CURVES.swoopRight} width={90} height={52} style={{ marginTop: '2px', marginLeft: '-4px' }} />
                </div>
                <div className="floaty shift-r">
                  <NoteInputCard />
                </div>
                <div>
                  <HandDrawnCurve d={CURVES.loopLeft} width={80} height={54} style={{ marginBottom: '-2px', marginLeft: '8px' }} />
                  <Annotation>拍完直接存進她的檔案，<br />不用再翻手機相簿</Annotation>
                </div>
              </div>

              {/* 同樣不用手機框：客戶檔案拆成兩張錯開的卡片 */}
              <div className="stage bleed-right">
                <div data-animate data-dir="left">
                  <CustomerCardsScatter />
                </div>
              </div>
            </div>
          </div>
          <MockNote />
          <CtaBar source="pro_scene4" pad="26px 22px 46px" />
        </Scene>

        {/* ══════════ 場景 5：後台一頁看懂（純白 + 大留白，做出空間感）══════════ */}
        <section className="scene-airy" style={{ background: '#ffffff' }}>
          <SceneTitle
            tone="dark"
            kicker="你的後台"
            title={<>今天幾個客人<br />下一位是誰</>}
            sub="它幫你把今日與本月的數字算好，最上面直接告訴你下一位是誰、還有多久到。不用自己算、不用翻本子。"
          />
          <div className="sc" data-animate>
            <div className="sc-scatter">
              {/* a：寬版後台（桌機視窗）— 整頁唯一的「寬」元素，打破直立手機的重複 */}
              <div className="wide">
                <DesktopFrame>
                  <AdminDesktop />
                </DesktopFrame>
              </div>

              {/* b：兩句標註左右分開，不再擠成一欄 */}
              <div className="note-l">
                <HandDrawnCurve d={CURVES.swoopRight} width={88} height={52} color={oak} />
                <Annotation tone="dark">下一位是誰、還有多久，<br />打開就在最上面</Annotation>
              </div>
              <div className="note-r">
                <HandDrawnCurve d={CURVES.hookDown} width={74} height={50} color={oak} flip style={{ marginBottom: '-2px', marginLeft: '6px' }} />
                <Annotation tone="dark">每週、每月成績單自動發到你 LINE，<br />不用自己算</Annotation>
              </div>
            </div>
          </div>
          <MockNote tone="dark" />
          <CtaBar source="pro_scene5" pad="26px 22px 46px" />
        </section>

        {/* ══════════ 零學習成本 / 無痛轉換 ══════════
            Gini 2026-08-02：職人拒絕新工具的第一名理由是「怕學不會」，排在價格前面。
            「你本來就在 LINE 接單」這個切角，把 MooLah 從「要學的新系統」變成
            「原本習慣的升級版」，風險感直接歸零 → 值得獨立一屏，不能只塞在 FAQ。 */}
        <section data-animate style={{ background: charcoalDeep, color: cream, padding: '52px 22px 56px' }}>
          <div style={{ maxWidth: '620px', margin: '0 auto' }}>
            <p style={{ fontSize: '12px', color: oak, fontWeight: 700, marginBottom: '12px' }}>零學習成本</p>
            <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 'clamp(2rem, 7.4vw, 2.8rem)', fontWeight: 400, lineHeight: 1.24, marginBottom: '14px' }}>
              你會用 LINE，<br />就會用 <span style={{ color: oak }}>MooLah</span>
            </h2>
            <p style={{ fontSize: '14.5px', lineHeight: 1.85, color: 'rgba(251,249,244,0.78)', marginBottom: '30px' }}>
              沒有新軟體要安裝，沒有新介面要背。你原本怎麼在 LINE 上接單，
              現在還是在 LINE 上——只是客人自己點時段，不再需要你一則一則回。
              說穿了，它就是一套長在 LINE 裡的線上預約系統，只是你和客人都不必為它改變習慣。
            </p>

            <div style={{ display: 'grid', gap: '10px', marginBottom: '28px' }}>
              {[
                { n: '01', t: '你不用改習慣', d: '後台就在 LINE 裡打開，預約進來直接跳通知。不必開電腦、不必記帳號密碼。' },
                { n: '02', t: '客人不用改習慣', d: '免下載 App、免註冊、免加入會員。客人點開連結就能選服務和時段。' },
                { n: '03', t: '現有客人直接搬過來', d: '原本 LINE 上的客人不必重新加好友，把預約連結傳給他們就開始用。' },
              ].map(x => (
                <div key={x.n} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', padding: '18px 18px', background: 'rgba(166,137,102,0.10)', border: '1px solid rgba(166,137,102,0.24)', borderRadius: '14px' }}>
                  <span style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '22px', color: oak, lineHeight: 1.2, flexShrink: 0 }}>{x.n}</span>
                  <div>
                    <p style={{ fontSize: '15px', fontWeight: 700, marginBottom: '5px' }}>{x.t}</p>
                    <p style={{ fontSize: '13.5px', lineHeight: 1.75, color: 'rgba(251,249,244,0.72)' }}>{x.d}</p>
                  </div>
                </div>
              ))}
            </div>

            <p style={{ fontSize: '13.5px', lineHeight: 1.8, color: 'rgba(251,249,244,0.66)', paddingLeft: '14px', borderLeft: `2px solid ${oak}` }}>
              不合用就停掉，你原本的 LINE 客人一個都不會少。<br />
              <strong style={{ color: cream, fontWeight: 700 }}>零成本、零風險。</strong>
            </p>
          </div>
        </section>

        {/* ══════════ 差異化四條：配圖卡（暖色漸層背景，與前後深色段拉開）══════════ */}
        <section data-animate style={{ background: 'linear-gradient(to bottom, #f7f1e7 0%, #fbf9f4 55%, #fbf9f4 100%)', padding: '10px 0 12px' }}>
          <div className="sc">
            <div style={{ maxWidth: '620px', paddingBottom: '4px' }}>
              <p style={{ fontSize: '12px', color: '#8a6f4f', fontWeight: 700, marginBottom: '10px' }}>是什麼讓 MooLah 不一樣</p>
              {/* ⚠️ 不設 maxWidth：Cormorant 對中文會 fallback，ch 單位算出來的寬度會誤傷斷行 */}
              <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 'clamp(1.9rem, 7vw, 2.6rem)', fontWeight: 400, color: charcoal, lineHeight: 1.25, marginBottom: '10px' }}>
                它不是一套<br />你要學著用的軟體
              </h2>
              <p style={{ fontSize: '14px', color: 'rgba(44,40,37,0.7)', lineHeight: 1.8, maxWidth: '44ch' }}>
                是一個幫你接單的助理。專心把「一個人也能接好單」這件事做到位。
              </p>
            </div>

            <div className="diff-grid">
              {[
                { img: 'photo-1746723372913-5bd18f616e3a', big: '0%', t: '抽佣', d: '客人付你多少，全部是你的。不從每一單抽成，只收固定月費——做越多賺越多，跟系統無關。' },
                { img: 'photo-1696664754572-c8b52a7fa917', big: '0', t: '綁約期', d: '沒有解約金、沒有安裝費，隨時可停。停用後資料保留 30 天，想回來接得上。' },
                { img: 'photo-1614068979671-68a6d87668ab', big: '1 對 1', t: '專屬窗口', d: '不是丟給客服系統。合作後由負責人本人對接，設定、調整、出狀況都找同一個人。' },
                { img: 'photo-1556741533-6e6a62bd8b49', big: '＋1', t: '免費客製立牌', d: '木底座壓克力夾、可抽換內卡，印上你的店名與專屬 QR，放店裡讓客人掃碼就約。' },
              ].map((x, i) => (
                // ⚠️ 不要用 data-delay={i*80}：data-delay 是「白名單」CSS 選擇器，
                // 只有 globals.css 明列的值（70/140/210…）會生效，80/160/240 全是空的 → stagger 靜默失效。
                // 任意數值一律走 inline transitionDelay。
                <figure key={i} data-animate style={{ transitionDelay: `${i * 80}ms` }} className="diff-card">
                  <div className="diff-photo">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`https://images.unsplash.com/${x.img}?auto=format&fit=crop&w=800&q=80`} alt="" loading="lazy" />
                    <div className="diff-veil" />
                    <figcaption>
                      <span className="diff-big">{x.big}</span>
                      <span className="diff-label">{x.t}</span>
                    </figcaption>
                  </div>
                  <p style={{ fontSize: '13.5px', color: 'rgba(44,40,37,0.72)', lineHeight: 1.75, marginTop: '14px' }}>{x.d}</p>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <CtaBar source="pro_diff" pad="26px 22px 24px" />

        {/* ══════════ 定價 ══════════ */}
        <section data-animate data-dir="scale" style={{ padding: '20px 22px 52px', maxWidth: '560px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ background: charcoalDeep, color: cream, borderRadius: '22px', padding: '38px 28px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(to right, transparent, ${oak}, transparent)` }} />
            <span style={{ display: 'inline-block', fontSize: '12px', fontWeight: 700, color: '#231f1b', background: oak, padding: '6px 16px', borderRadius: '99px', marginBottom: '18px', letterSpacing: '0.04em' }}>限時開放</span>
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 'clamp(2.6rem, 11vw, 3.8rem)', fontWeight: 300, color: cream, lineHeight: 1.05, marginBottom: '10px' }}>
              先<span style={{ color: oak, fontStyle: 'italic' }}>免費</span>試用<br />全部功能
            </p>
            <p style={{ fontSize: '13.5px', color: 'rgba(251,249,244,0.7)', marginBottom: '22px', lineHeight: 1.7 }}>
              14 天全功能開放、不需信用卡，<br />先用起來，喜歡再留下。
            </p>
            <p style={{ fontSize: '12.5px', color: 'rgba(251,249,244,0.52)', marginBottom: '26px' }}>
              試用後 NT$699／月・0 抽佣・不綁約・隨時可停
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '9px', textAlign: 'left' }}>
              {['✓ 0% 抽佣', '✓ 不綁約無解約金', '✓ 免費客製立牌', '✓ 專人帶你設定'].map(t => (
                <p key={t} style={{ fontSize: '12.5px', color: 'rgba(251,249,244,0.88)', padding: '10px 12px', background: 'rgba(166,137,102,0.16)', borderRadius: '10px', border: '1px solid rgba(166,137,102,0.24)' }}>{t}</p>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════ 常見問題 ══════════ */}
        <section data-animate style={{ padding: '10px 22px 54px', maxWidth: '620px', margin: '0 auto' }}>
          <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 'clamp(1.8rem, 6.5vw, 2.3rem)', fontWeight: 400, color: charcoal, lineHeight: 1.28, marginBottom: '22px', textWrap: 'balance' }}>
            開通前 你可能想問
          </h2>
          <div>
            {FAQ.map((f, i) => (
              /* 依序展開，眼睛跟著一條條往下走；每階 60ms，10 題總延遲仍在半秒內 */
              <details key={i} data-animate style={{ borderTop: i === 0 ? `1px solid ${oak}30` : 'none', borderBottom: `1px solid ${oak}30`, transitionDelay: `${i * 60}ms` }}>
                <summary style={{ cursor: 'pointer', listStyle: 'none', padding: '17px 30px 17px 0', fontSize: '14.5px', fontWeight: 600, color: charcoal, lineHeight: 1.5, position: 'relative' }}>
                  {f.q}
                  <span aria-hidden style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)', color: oak, fontSize: '18px', lineHeight: 1 }}>＋</span>
                </summary>
                <p style={{ fontSize: '13.5px', color: 'rgba(44,40,37,0.74)', lineHeight: 1.8, padding: '0 8px 18px 0' }}>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ══════════ 最終 CTA ══════════ */}
        <section id="apply" data-animate style={{ padding: '10px 22px 60px', maxWidth: '620px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 'clamp(1.8rem, 6.5vw, 2.3rem)', fontWeight: 400, color: charcoal, lineHeight: 1.28, marginBottom: '10px', textWrap: 'balance' }}>
              30 秒開通 今天就能接單
            </h2>
            <p style={{ fontSize: '14px', color: 'rgba(44,40,37,0.68)', lineHeight: 1.7 }}>
              真人一對一幫你把接單助理設好，當天就能開始收預約。<br />
              <span style={{ color: charcoal, fontWeight: 600 }}>用你舒服的方式開始就好。</span>
            </p>
          </div>

          {/*
            承諾強度階梯（commitment ladder）
            ────────────────────────────────
            冷流量不是只有「要」跟「不要」兩種——中間還有一大群「有興趣但還沒準備好被推銷」的人。
            整頁七個 CTA 全是同一句高承諾的「開通試用」，等於只接住最熱的那一小撮，
            剩下的人沒有台階可下就直接離開。
            這裡並列三種溫度：開通(熱) / 先問問(溫) / 自己看(冷)，三條都通到同一個窗口。
            ⚠️ 刻意收在同一個區塊、主次分明（主鈕滿寬、次選項並排且視覺較輕），
               避免變成三個等重選項造成決策癱瘓。
          */}
          <TrackedLineLink href={LINE_URL} source="pro_mid"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: '#06C755', color: '#fff', padding: '18px 24px', borderRadius: '14px', fontSize: '16px', fontWeight: 700, textDecoration: 'none', boxShadow: '0 8px 26px rgba(6,199,85,0.35)', marginBottom: '10px' }}>
            <LineIcon /> 開通 14 天免費試用
          </TrackedLineLink>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
            <TrackedLineLink href={LINE_URL} source="pro_ask_first"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px', background: '#fff', color: charcoal, padding: '14px 12px', borderRadius: '12px', textDecoration: 'none', border: `1px solid ${oak}45`, minHeight: '62px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700 }}>先問幾個問題</span>
              <span style={{ fontSize: '11.5px', color: 'rgba(44,40,37,0.6)' }}>還不用決定要不要用</span>
            </TrackedLineLink>

            <a href={DEMO_URL}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px', background: '#fff', color: charcoal, padding: '14px 12px', borderRadius: '12px', textDecoration: 'none', border: `1px solid ${oak}45`, minHeight: '62px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700 }}>自己先看看</span>
              <span style={{ fontSize: '11.5px', color: 'rgba(44,40,37,0.6)' }}>不用留任何資料</span>
            </a>
          </div>

          {/*
            桌機專用 QR。
            ────────────────────────────────
            2026-07-31 漏斗實測：「點加 LINE」→「真的加好友」流失 75%。
            最可能的成因是桌機點擊——桌機點 line.me 連結會跳網頁版或要求開 App，多數人直接放棄。
            手機不需要這塊（點按鈕就會開 App），所以只在 ≥md 顯示。
            ⚠️ display 一律交給 Tailwind class，行內 style 絕不可寫 display，
               否則會蓋掉 `hidden`（Day 59 sticky CTA 桌機誤顯示就是這樣來的）。
          */}
          <div className="hidden md:flex" style={{ alignItems: 'center', gap: '16px', background: 'white', padding: '16px 20px', borderRadius: '14px', border: `1px solid ${oak}22`, marginBottom: '20px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/qr-line-oa.png" alt="用手機掃碼加 LINE @492ejbwx" loading="lazy"
              style={{ width: '96px', height: '96px', flexShrink: 0, borderRadius: '8px', border: `1px solid ${oak}30`, padding: '5px', background: '#fff' }} />
            <div>
              <p style={{ fontSize: '14px', fontWeight: 700, color: charcoal, marginBottom: '4px' }}>用電腦看的話，掃這個</p>
              <p style={{ fontSize: '13px', color: 'rgba(44,40,37,0.72)', lineHeight: 1.7 }}>
                手機相機掃一下就能加我 LINE，<br />不用在電腦上找 LINE 登入。
              </p>
            </div>
          </div>

          <div style={{ background: 'white', padding: '26px 22px', borderRadius: '18px', border: `1px solid ${oak}22` }}>
            <p style={{ fontSize: '14px', fontWeight: 700, color: charcoal, marginBottom: '4px' }}>不方便聊？留下資料</p>
            <p style={{ fontSize: '13px', color: 'rgba(44,40,37,0.8)', marginBottom: '22px' }}>我們 24 小時內主動聯絡你，幫你開通試用</p>
            <JoinForm />
          </div>
        </section>

        {/* ══════════ 專屬窗口名片 ══════════ */}
        <section data-animate data-dir="scale" style={{ padding: '8px 22px 44px', maxWidth: '520px', margin: '0 auto' }}>
          <p style={{ fontSize: '13.5px', color: 'rgba(44,40,37,0.68)', textAlign: 'center', lineHeight: 1.8, marginBottom: '22px' }}>
            助理幫你顧單，人由我來顧。<br />
            <span style={{ color: charcoal, fontWeight: 600 }}>合作後，我就是你的專屬窗口——有任何問題，直接敲我。</span>
          </p>

          <div style={{ borderRadius: '18px', overflow: 'hidden', boxShadow: '0 18px 44px rgba(26,23,20,0.22)', border: `1px solid ${oak}30` }}>
            <div style={{ position: 'relative', background: charcoalDeep, padding: '26px 24px 22px', textAlign: 'center' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(to right, transparent, ${oak}, transparent)` }} />
              <div style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '26px', fontWeight: 500, letterSpacing: '0.5em', textIndent: '0.5em', color: 'rgba(251,249,244,0.9)' }}>MOOLAH</div>
              <div style={{ fontSize: '9.5px', fontWeight: 300, letterSpacing: '0.35em', textIndent: '0.35em', textTransform: 'uppercase', color: 'rgba(166,137,102,0.75)', marginTop: '7px' }}>Booking Service</div>
            </div>
            <div style={{ background: cream, padding: '24px 24px 22px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '34px', fontWeight: 500, color: charcoal, lineHeight: 1 }}>Gini</div>
                <div style={{ fontSize: '11px', color: '#8a6f4f', letterSpacing: '0.06em', marginTop: '8px', marginBottom: '16px' }}>MooLah・專屬合作窗口</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <span style={{ fontSize: '10px', color: 'rgba(44,40,37,0.45)', letterSpacing: '0.05em' }}>LINE</span>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: charcoal }}>@492ejbwx</span>
                </div>
              </div>
              <div style={{ flexShrink: 0, textAlign: 'center' }}>
                {/*
                  QR 自架，不打第三方 API。
                  舊版即時呼叫 api.qrserver.com 產生 → 對方掛掉或擋流量，名片區就變破圖。
                  重生方式：public/qr-line-oa.png（python qrcode，容錯率 M，600×600）。
                */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/qr-line-oa.png"
                  alt="加 LINE @492ejbwx" loading="lazy"
                  style={{ width: '76px', height: '76px', display: 'block', borderRadius: '6px', border: `1px solid ${oak}30`, padding: '4px', background: '#fff' }}
                />
                <div style={{ fontSize: '9px', color: 'rgba(44,40,37,0.48)', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: '6px' }}>Add LINE</div>
              </div>
            </div>
          </div>

          <TrackedLineLink href={LINE_URL} source="pro_card"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px', background: '#06C755', color: '#fff', padding: '15px 24px', borderRadius: '13px', fontSize: '15px', fontWeight: 700, textDecoration: 'none', marginTop: '18px', boxShadow: '0 8px 24px rgba(6,199,85,0.3)' }}>
            <LineIcon size={18} /> 直接加 Gini 的 LINE
          </TrackedLineLink>
        </section>

        {/* ══════════ 營運方資訊 ══════════ */}
        <section data-animate style={{ background: charcoalDeep, color: cream, padding: '38px 22px 42px' }}>
          <div style={{ maxWidth: '560px', margin: '0 auto' }}>
            <p style={{ fontSize: '12px', color: 'rgba(251,249,244,0.55)', marginBottom: '16px', letterSpacing: '0.04em' }}>系統開發與營運</p>
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.5rem', fontWeight: 400, marginBottom: '18px' }}>永翔數位有限公司</p>
            <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '10px 20px', fontSize: '13px', lineHeight: 1.6 }}>
              <dt style={{ color: 'rgba(251,249,244,0.55)' }}>統一編號</dt>
              <dd style={{ margin: 0, color: 'rgba(251,249,244,0.9)' }}>62130226</dd>
              <dt style={{ color: 'rgba(251,249,244,0.55)' }}>服務信箱</dt>
              <dd style={{ margin: 0 }}><a href="mailto:service@moolah.studio" style={{ color: oak, textDecoration: 'none' }}>service@moolah.studio</a></dd>
              <dt style={{ color: 'rgba(251,249,244,0.55)' }}>合作洽詢</dt>
              <dd style={{ margin: 0, color: 'rgba(251,249,244,0.9)' }}>LINE @492ejbwx</dd>
              <dt style={{ color: 'rgba(251,249,244,0.55)' }}>回覆時間</dt>
              <dd style={{ margin: 0, color: 'rgba(251,249,244,0.9)' }}>每日 10:00–21:00</dd>
            </dl>
            <p style={{ fontSize: '12px', color: 'rgba(251,249,244,0.45)', lineHeight: 1.8, marginTop: '22px' }}>
              MooLah 為永翔數位有限公司自行開發之預約管理系統，服務台灣各縣市的美業與服務業職人。
            </p>
          </div>
        </section>

      </main>
      <SiteFooter b2b />
      <StickyTrialCTA />
    </>
  )
}
