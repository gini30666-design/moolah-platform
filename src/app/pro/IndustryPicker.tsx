'use client'
import { useState } from 'react'
import { IndustryScreen, type Screen } from './IndustryScreens'

const oak = '#A68966'
const oakDeep = '#8a6f4f'
const charcoal = '#2C2825'

/**
 * 產業分眾區（對標客立樂「專注於每個產業」）。
 *
 * 兩層互動：選產業 → 選功能 → 右側手機換成該產業、該功能的專屬畫面。
 * 每個功能都有「效益句 + 細節句」兩層說明（他們的寫法）。
 *
 * ⚠️ 誠實邊界：功能全部是系統實際具備的（作品歷史／時長鎖位／客戶備註／候補／
 *    爽約標記／週報／今日總覽／LINE 提醒／作品集／專屬預約頁）。
 *    差別在「每個產業拿它來記什麼、排什麼」——這是真實的使用差異，不是虛構功能。
 */

type Feature = {
  icon: React.ReactNode
  name: string
  benefit: string   // 一句白話效益
  detail: string    // 一句細節說明
  screen: Screen
}
type Industry = { key: string; label: string; headline: string; features: Feature[] }

/* ── 線條圖示 ─────────────────────────────────────────────────── */
const ic = {
  viewBox: '0 0 24 24', fill: 'none' as const, stroke: 'currentColor',
  strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
  style: { width: '21px', height: '21px' },
}
const I = {
  note: <svg {...ic}><path d="M5 4h11l3 3v13H5z" /><path d="M8 10h8M8 14h5" /></svg>,
  clock: <svg {...ic}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>,
  bell: <svg {...ic}><path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6" /><path d="M10 19a2 2 0 0 0 4 0" /></svg>,
  photo: <svg {...ic}><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="8.5" cy="10" r="1.5" /><path d="m3 16 5-4 4 3 3-2 6 5" /></svg>,
  tag: <svg {...ic}><path d="M3 12V5a2 2 0 0 1 2-2h7l9 9-9 9z" /><circle cx="8" cy="8" r="1.4" /></svg>,
  queue: <svg {...ic}><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" /></svg>,
  shield: <svg {...ic}><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="m9 12 2 2 4-4" /></svg>,
  chart: <svg {...ic}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>,
  home: <svg {...ic}><path d="M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" /></svg>,
  link: <svg {...ic}><path d="M10 13a4 4 0 0 0 5.7 0l3-3A4 4 0 0 0 13 4.3l-1.7 1.7" /><path d="M14 11a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 19.7l1.7-1.7" /></svg>,
}

/* 照片素材（Unsplash，URL 皆已驗證可用） */
const P = {
  hair: ['photo-1634449571010-02389ed0f9b0', 'photo-1582095133179-bfd08e2fc6b3', 'photo-1675034743339-0b0747047727'],
  nail: ['photo-1753285310651-6974a839c992', 'photo-1693681865852-def4481fa530', 'photo-1612239395391-dab5de40aa0f'],
  pet: ['photo-1780400949517-36f4f003e73c'],
  car: ['photo-1708805282676-0c15476eb8a2', 'photo-1620584898989-d39f7f9ed1b7', 'photo-1665944956738-7bde2372622d'],
  salon: ['photo-1626379501846-0df4067b8bb9', 'photo-1760862652442-e8ff7ebdd2f8'],
  facial: ['photo-1631730486572-226d1f595b68'],
}

const INDUSTRIES: Industry[] = [
  {
    key: 'hair', label: '美髮沙龍',
    headline: '從配方到檔期，一個人也管得住',
    features: [
      {
        icon: I.note, name: '客戶作品歷史',
        benefit: '上次的髮色配方，下次點開就有',
        detail: '每次服務可上傳照片＋寫下配方比例，客人回訪時一鍵查找，不用再翻對話紀錄回想。',
        screen: {
          kind: 'history', who: '王小姐', visits: '6 次', photos: P.hair,
          entries: [
            { date: '5/12', label: '染髮 + 護髮', note: '8/0 + 7/43 = 1:1，氧化劑 6%。客人喜歡偏冷的自然棕' },
            { date: '3/02', label: '燙髮', note: '中大卷，瀏海不燙。髮尾偏乾，建議三週後回來護髮' },
          ],
        },
      },
      {
        icon: I.clock, name: '服務時長各自鎖位',
        benefit: '燙染 3 小時就佔滿 3 小時',
        detail: '每個服務項目獨立設定時長，它不可能把這單排進 1 小時的空檔，也不會被別人插單。',
        screen: {
          kind: 'duration', shop: 'Studio Aurelia',
          services: [
            { name: '洗剪造型', min: 60, price: 800 },
            { name: '染髮 + 護髮', min: 180, price: 3200, hi: true },
            { name: '燙髮（含護理）', min: 210, price: 4200 },
            { name: '深層護髮', min: 45, price: 1200 },
          ],
        },
      },
      {
        icon: I.bell, name: '前一天自動提醒',
        benefit: '不用你開口催，爽約自然變少',
        detail: '它會在服務前一天固定時間替你送出提醒，客人點一下就能確認或改期，空出的時段馬上釋出。',
        screen: { kind: 'reminder', shop: 'Studio Aurelia', service: '染髮 + 護髮', date: '7/28 (一)', time: '14:00' },
      },
    ],
  },
  {
    key: 'nail', label: '美甲美睫',
    headline: '款式給客人看，時段卡得剛好',
    features: [
      {
        icon: I.photo, name: '作品集就是你的型錄',
        benefit: '不用再從 IG 翻半天找款式',
        detail: '分類上傳、拖曳排序，連結貼在 IG 個人簡介，客人自己看自己挑，挑完直接約。',
        screen: { kind: 'portfolio', title: 'Lumi Nail・作品集', photos: [...P.nail, ...P.nail] },
      },
      {
        icon: I.clock, name: '手足同做也排得準',
        benefit: '一次做兩項，時間自動加總',
        detail: '每個服務獨立設定時長，客人選了什麼就照實鎖多久，不會做到一半被插單。',
        screen: {
          kind: 'duration', shop: 'Lumi Nail Studio',
          services: [
            { name: '單色凝膠', min: 90, price: 1200 },
            { name: '法式・彩繪設計', min: 120, price: 1800 },
            { name: '手足同做', min: 180, price: 2600, hi: true },
            { name: '卸甲 + 保養', min: 30, price: 400 },
          ],
        },
      },
      {
        icon: I.tag, name: '客戶偏好與過敏標籤',
        benefit: '她一預約，注意事項就跳出來',
        detail: '標籤數量不限，自己定義。指緣狀況、偏好色系、上次做什麼，全部留在她的檔案裡。',
        screen: {
          kind: 'notes', who: '李小姐', tags: ['指緣易乾', '偏好裸色系', '不留長'],
          note: '上次做法式，指緣有點敏感 → 這次改用低敏底膠。她提過月底有婚禮，可以推薦亮片款。',
          photos: P.nail.slice(0, 3),
        },
      },
    ],
  },
  {
    key: 'ear', label: '採耳',
    headline: '客人多是回頭客，狀況要記得住',
    features: [
      {
        icon: I.tag, name: '耳況自訂標籤',
        benefit: '油耳、敏感、上次清到哪都留著',
        detail: '標籤自己定義，服務歷史照片一起存。交接或代班時，別人也能維持一樣的服務品質。',
        screen: {
          kind: 'notes', who: '陳先生', tags: ['油耳', '左耳較敏感', '偏好輕手'],
          note: '上次左耳有輕微發炎，建議先觀察。客人喜歡採耳後加頭部按摩，下次可主動問。',
        },
      },
      {
        icon: I.link, name: '客人不用下載 App',
        benefit: '在 LINE 裡直接約完',
        detail: '免下載、免註冊、免加入會員。加了你的官方帳號就能約，長輩客人也不會卡關。',
        screen: {
          kind: 'page', shop: '聽然採耳所', tagline: '安靜地，把耳朵交給我', from: 800,
          photos: P.salon,
        },
      },
      {
        icon: I.clock, name: '你在服務時照樣接單',
        benefit: '一個人做也不怕漏客',
        detail: '24 小時自動收預約，你手上在服務時不用停下來回訊息，忙完再一次看就好。',
        screen: {
          kind: 'duration', shop: '聽然採耳所',
          services: [
            { name: '基礎採耳', min: 40, price: 800 },
            { name: '深層清潔採耳', min: 60, price: 1200, hi: true },
            { name: '耳燭放鬆療程', min: 50, price: 1000 },
            { name: '採耳 + 頭部按摩', min: 90, price: 1600 },
          ],
        },
      },
    ],
  },
  {
    key: 'facial', label: '做臉・美容',
    headline: '療程要追蹤，客人要回來',
    features: [
      {
        icon: I.photo, name: '膚況變化留得住',
        benefit: '療程前後一比對，效果講得出來',
        detail: '每次服務存照片＋筆記，客人問「有沒有變好」時，直接把紀錄調出來給她看。',
        screen: {
          kind: 'history', who: '張小姐', visits: '8 次', photos: [...P.facial, ...P.salon],
          entries: [
            { date: '6/20', label: '深層清潔', note: 'T 字區粉刺明顯改善，兩頰仍偏乾。這次加了保濕導入' },
            { date: '5/28', label: '客製保濕護理', note: '客人熬夜較多，膚色暗沉。建議兩週回來一次' },
          ],
        },
      },
      {
        icon: I.clock, name: '長療程不被趕場',
        benefit: '90 分鐘就鎖 90 分鐘',
        detail: '療程時長各自設定，中間不會被硬塞新單，你可以照自己的節奏做完整套流程。',
        screen: {
          kind: 'duration', shop: 'Aube 肌膚管理',
          services: [
            { name: '基礎深層清潔', min: 60, price: 1500 },
            { name: '客製保濕護理', min: 90, price: 2800, hi: true },
            { name: '導入修護療程', min: 75, price: 2200 },
            { name: '背部深層清潔', min: 80, price: 2400 },
          ],
        },
      },
      {
        icon: I.chart, name: '該關心誰它會告訴你',
        benefit: '每週成績單自動送到你 LINE',
        detail: '成交幾筆、收多少、哪個療程最熱門，不用自己算。也會提醒你該回訪哪些久未到訪的客人。',
        screen: { kind: 'report', range: '7/21 – 7/27', deals: 16, revenue: 34800, top: '客製保濕護理', pct: 46 },
      },
    ],
  },
  {
    key: 'massage', label: '按摩・舒壓',
    headline: '熱門時段別空轉，爽約別再來',
    features: [
      {
        icon: I.queue, name: '候補名單自動遞補',
        benefit: '有人取消，它立刻通知候補',
        detail: '時段滿了客人可以登記候補，一有空位它自動發通知，先搶先贏——時段不會白白空掉。',
        screen: {
          kind: 'waitlist', slot: '7/28 (一) 19:00',
          queue: [{ name: '林小姐', at: '今天 10:24' }, { name: '吳先生', at: '今天 13:07' }, { name: '周小姐', at: '昨天 21:15' }],
        },
      },
      {
        icon: I.shield, name: '爽約標記與黑名單',
        benefit: '慣性放鳥的客人擋在門外',
        detail: '每筆預約都可標記完成或爽約，累積紀錄一目瞭然。屢次爽約可加入黑名單，不再開放預約。',
        screen: {
          kind: 'noshow',
          rows: [
            { name: '黃先生', date: '7/20 19:00', state: '爽約' },
            { name: '黃先生', date: '7/06 20:00', state: '爽約' },
            { name: '劉小姐', date: '7/18 15:00', state: '完成' },
            { name: '鄭小姐', date: '7/15 11:00', state: '完成' },
          ],
        },
      },
      {
        icon: I.chart, name: '每週成績單自動送',
        benefit: '這禮拜做了多少，週一就知道',
        detail: '成交筆數、營收、下週已預約、最熱門的服務，每週一早上自動推播到你的 LINE。',
        screen: { kind: 'report', range: '7/21 – 7/27', deals: 24, revenue: 28800, top: '全身舒壓 60 分', pct: 52 },
      },
    ],
  },
  {
    key: 'pet', label: '寵物美容',
    headline: '毛孩體型差很多，時間要抓得準',
    features: [
      {
        icon: I.clock, name: '大狗小狗各自算時間',
        benefit: '一天能接幾隻，它自己算',
        detail: '每個項目獨立設定時長與價格，大型犬全套 2.5 小時就佔滿，不會排到自己爆檔。',
        screen: {
          kind: 'duration', shop: '毛日子寵物美容',
          services: [
            { name: '小型犬洗澡', min: 60, price: 600 },
            { name: '大型犬全套美容', min: 150, price: 1800, hi: true },
            { name: '造型修剪', min: 90, price: 1200 },
            { name: '指甲 + 耳道清潔', min: 20, price: 300 },
          ],
        },
      },
      {
        icon: I.note, name: '毛孩狀況全都記著',
        benefit: '脾氣、皮膚、上次剃多短',
        detail: '每隻毛孩一份檔案，備註加照片留著。換手服務或隔很久再來，也不會忘記牠的狀況。',
        screen: {
          kind: 'notes', who: 'Mochi（柴犬・4 歲）', tags: ['怕吹風機', '皮膚易紅', '不剃腳底'],
          note: '上次剃 8mm 飼主說太短，這次留 12mm。洗完會躁動，建議先剪指甲再洗。',
          photos: P.pet,
        },
      },
      {
        icon: I.bell, name: '飼主前一天收到提醒',
        benefit: '少一次放鳥，多一個下午',
        detail: '附上時間與地點，飼主點一下就能確認或改期。空出來的時段可以馬上補其他客人。',
        screen: { kind: 'reminder', shop: '毛日子寵物美容', service: '大型犬全套美容', date: '7/28 (一)', time: '10:00' },
      },
    ],
  },
  {
    key: 'auto', label: '汽車美容',
    headline: '施工一整天，檔期要排得開',
    features: [
      {
        icon: I.clock, name: '一整天的工項排得下',
        benefit: '鍍膜 8 小時、洗車 1.5 小時',
        detail: '長工時與短工時各自設定，它自動算出當天還能不能再接一台，不會超收。',
        screen: {
          kind: 'duration', shop: 'Grit Auto Detailing',
          services: [
            { name: '精緻手工洗車', min: 90, price: 900 },
            { name: '車內深層清潔', min: 120, price: 2500 },
            { name: '鍍膜施工', min: 480, price: 12000, hi: true },
            { name: '鋼圈・輪胎養護', min: 60, price: 1200 },
          ],
        },
      },
      {
        icon: I.photo, name: '施工前後對照留存',
        benefit: '公開的接新客，私下的好交代',
        detail: '作品集公開展示吸引新客戶；每台車的施工紀錄與照片存在客戶檔案，日後有爭議調得出來。',
        screen: { kind: 'portfolio', title: 'Grit・施工實績', photos: [...P.car, ...P.car] },
      },
      {
        icon: I.bell, name: '不用一直接電話回報',
        benefit: '預約與通知都在 LINE',
        detail: '車主約好就收到確認，前一天自動提醒。完成後你從後台一鍵聯絡他來取車。',
        screen: { kind: 'reminder', shop: 'Grit Auto Detailing', service: '鍍膜施工', date: '7/29 (二)', time: '09:00' },
      },
    ],
  },
  {
    key: 'solo', label: '個人工作室',
    headline: '一個人校長兼撞鐘，沒有櫃檯幫你',
    features: [
      {
        icon: I.home, name: '今天幾個客人一眼看完',
        benefit: '下一位是誰、還有多久',
        detail: '打開後台首頁就看到今日與本月的數字，最上面直接告訴你下一位是誰、幾點到、做什麼。',
        screen: {
          kind: 'today', count: 4, revenue: 6800,
          next: { time: '14:00', name: '王小姐', service: '客製療程', min: 90 },
        },
      },
      {
        icon: I.link, name: '開通就有專屬預約頁',
        benefit: '不會架網站也沒關係',
        detail: '一個專屬網址，放作品、放價格、直接收預約。再附一張免費客製立牌，放店裡讓客人掃碼。',
        screen: {
          kind: 'page', shop: '你的工作室', tagline: '把時間，留給值得的人', from: 990,
          photos: P.salon,
        },
      },
      {
        icon: I.chart, name: '每月成績單自動整理',
        benefit: '不用自己開 Excel 算',
        detail: '這個月成交幾筆、收多少、哪個服務最受歡迎，月初自動推播到你的 LINE。',
        screen: { kind: 'report', range: '7/01 – 7/31', deals: 42, revenue: 68400, top: '主力服務 90 分', pct: 38 },
      },
    ],
  },
]

export default function IndustryPicker() {
  const [ind, setInd] = useState(0)
  const [feat, setFeat] = useState(0)
  const industry = INDUSTRIES[ind]
  const feature = industry.features[feat]

  const pick = (i: number) => { setInd(i); setFeat(0) }

  return (
    <div>
      {/* 產業切換 */}
      <div className="ind-tabs">
        {INDUSTRIES.map((x, i) => {
          const on = i === ind
          return (
            <button key={x.key} onClick={() => pick(i)} aria-pressed={on} style={{
              flex: '0 0 auto', scrollSnapAlign: 'center', cursor: 'pointer',
              padding: '10px 18px', borderRadius: '99px', minHeight: '42px',
              fontSize: '14.5px', fontWeight: on ? 700 : 500,
              background: on ? oak : 'transparent',
              color: on ? '#231f1b' : 'rgba(44,40,37,0.78)',
              border: `1px solid ${on ? oak : 'rgba(166,137,102,0.45)'}`,
              transition: 'background .35s cubic-bezier(0.16,1,0.3,1), color .35s, border-color .35s',
              whiteSpace: 'nowrap',
            }}>{x.label}</button>
          )
        })}
      </div>

      <div className="ind-body">
        {/* 左：該產業的標語 + 三個功能（點了換右邊畫面）*/}
        <div className="ind-copy">
          <p key={industry.key} style={{
            fontSize: 'clamp(17px, 4.8vw, 21px)', lineHeight: 1.55, color: charcoal,
            fontWeight: 700, marginBottom: '20px', animation: 'indFade .4s cubic-bezier(0.16,1,0.3,1)',
          }}>
            {industry.headline}
          </p>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {industry.features.map((f, i) => {
              const on = i === feat
              return (
                <li key={f.name} style={{ borderTop: i === 0 ? 'none' : '1px solid rgba(44,40,37,0.1)' }}>
                  <button
                    onClick={() => setFeat(i)}
                    aria-expanded={on}
                    style={{
                      width: '100%', textAlign: 'left', background: 'none', border: 'none',
                      cursor: 'pointer', padding: '17px 0', display: 'flex', gap: '13px', alignItems: 'flex-start',
                    }}
                  >
                    <span style={{ color: on ? oak : 'rgba(166,137,102,0.55)', flexShrink: 0, marginTop: '1px', transition: 'color .3s' }}>
                      {f.icon}
                    </span>
                    <span style={{ minWidth: 0, flex: 1 }}>
                      <span style={{ display: 'block', fontSize: '16px', fontWeight: 700, color: on ? charcoal : 'rgba(44,40,37,0.86)', marginBottom: '4px', transition: 'color .3s' }}>
                        {f.name}
                      </span>
                      <span style={{ display: 'block', fontSize: '14px', color: on ? oakDeep : 'rgba(44,40,37,0.74)', fontWeight: 600, lineHeight: 1.5, transition: 'color .3s' }}>
                        {f.benefit}
                      </span>
                      {on && (
                        <span style={{ display: 'block', fontSize: '13.5px', color: 'rgba(44,40,37,0.88)', lineHeight: 1.75, marginTop: '8px', animation: 'indFade .35s cubic-bezier(0.16,1,0.3,1)' }}>
                          {f.detail}
                        </span>
                      )}
                    </span>
                    <span aria-hidden style={{
                      flexShrink: 0, color: on ? oakDeep : 'rgba(44,40,37,0.3)', fontSize: '15px', lineHeight: 1,
                      transform: on ? 'rotate(90deg)' : 'none', transition: 'transform .3s, color .3s', marginTop: '3px',
                    }}>›</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        {/* 右：該產業 × 該功能的專屬畫面 */}
        <div className="ind-stage">
          <IndustryScreen screen={feature.screen} />
        </div>
      </div>

      <p className="ind-note">畫面示意，客戶姓名與數字為示範資料</p>

      <style>{`
        .ind-tabs {
          display: flex; gap: 8px; overflow-x: auto; padding: 2px 22px 22px;
          scroll-snap-type: x proximity; -webkit-overflow-scrolling: touch;
          scrollbar-width: none; max-width: 1260px; margin: 0 auto;
        }
        .ind-tabs::-webkit-scrollbar { display: none; }
        .ind-body { max-width: 1260px; margin: 0 auto; padding: 0 22px; display: grid; gap: 28px; }
        .ind-stage { display: flex; justify-content: center; }
        .ind-note {
          max-width: 1260px; margin: 14px auto 0; padding: 0 22px;
          font-size: 10.5px; color: rgba(44,40,37,0.62); text-align: center;
        }
        @media (min-width: 880px) {
          .ind-body { grid-template-columns: 1fr auto; gap: 60px; align-items: center; }
          .ind-stage { justify-content: flex-end; }
          .ind-note { text-align: left; }
        }
        @keyframes indFade { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }
        @media (prefers-reduced-motion: reduce) { .ind-copy p, .ind-copy span { animation: none !important } }
      `}</style>
    </div>
  )
}
