'use client'
import { useState } from 'react'
import { PhoneFrame, StepNum } from './StoryScenes'

/**
 * 三步驟手機：桌機與手機都維持「重疊交錯」的排法，只是整組等比縮放。
 *
 * 為什麼用 transform: scale 而不是縮小每個元素——
 *   三支手機的重疊、旋轉、位移是一組互相咬合的關係，
 *   個別縮小會讓重疊比例跑掉；整組 scale 才能原樣保留視覺，
 *   在 375px 手機上也看得到同樣的層次。
 *
 * 互動：桌機用 hover，觸控裝置沒有 hover → 用點擊切換（點哪支哪支跳起來轉正）。
 */

const STEPS = [
  { src: '/pro-screen-3.jpg', n: '01', cap: '看作品 挑喜歡的', w: 168 },
  { src: '/pro-screen-1.jpg', n: '02', cap: '選服務 看價格', w: 252 },
  { src: '/pro-screen-2.jpg', n: '03', cap: '挑時段 送出', w: 186 },
]

// 設計基準尺寸（scale = 1 時的實際佔位），縮放與高度都以此換算
const BASE_W = 624   // 含 caption 左右溢出的實際佔位寬
const BASE_H = 700

export default function StepPhones() {
  const [active, setActive] = useState<number | null>(null)

  return (
    <div className="steps-scaler">
      <div className="sc-steps">
        {STEPS.map((s, i) => (
          <figure
            key={s.src}
            className={active === i ? 'is-active' : undefined}
            /*
              只綁 onClick：桌機的浮起由 CSS :hover 負責，這個 state 是給觸控裝置用的。
              曾經加過 onMouseLeave 清除狀態，但它會在非預期時機（例如指標離開視窗）
              把 tap 選中的狀態清掉，反而讓手機上點了沒反應。
            */
            onClick={() => setActive(a => (a === i ? null : i))}
          >
            {/*
              進場動畫掛在這層內層 div，不能掛 <figure>：
              figure 的 transform 帶著整組的交錯位移與旋轉（translateX/rotate），
              被 .will-animate 的 transform 覆蓋後，.in-view 的 transform:none 會永久清掉排版。
              依 01→02→03 依序浮起，呼應「三步就約完」的節奏。
            */}
            <div data-animate style={{ transitionDelay: `${i * 90}ms` }}>
              <PhoneFrame width={s.w}>
                {/* 不用 lazy、先用 aspectRatio 撐高，避免圖未到時外框塌陷 */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.src} alt={s.cap} width={390} height={844} decoding="async"
                  style={{ width: '100%', display: 'block', aspectRatio: '390 / 844', objectFit: 'cover' }}
                />
              </PhoneFrame>
              <figcaption className="step-cap">
                <StepNum n={s.n} />
                <span>{s.cap}</span>
              </figcaption>
            </div>
          </figure>
        ))}
      </div>

      <style>{`
        .steps-scaler {
          --s: 1;
          display: flex;
          justify-content: center;
          height: calc(${BASE_H}px * var(--s));
        }
        .sc-steps {
          width: ${BASE_W}px;
          flex-shrink: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0;
          transform: scale(var(--s));
          transform-origin: top center;
        }
        .sc-steps figure {
          margin: 0;
          text-align: center;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          transition: transform .5s cubic-bezier(0.16,1,0.3,1);
        }
        /* 位移要夠大，側邊兩支的說明才不會被中間那支蓋住 */
        .sc-steps figure:nth-child(1) { transform: translateX(46px) translateY(74px) rotate(-5deg); z-index: 1; }
        .sc-steps figure:nth-child(2) { z-index: 3; }
        .sc-steps figure:nth-child(3) { transform: translateX(-46px) translateY(88px) rotate(5deg); z-index: 2; }
        .step-cap { position: relative; z-index: 5; margin-top: 14px; }
        .step-cap span {
          display: block;
          font-size: 13px;
          color: rgba(44,40,37,0.72);
          font-weight: 600;
          white-space: nowrap;
        }

        /*
          選中（點擊或 hover）→ 跳起來轉正。
          ⚠️ 每支要各自保留原本的 translateX，否則側邊那兩支會水平跳回中線，
             第三支會往右衝出容器，說明文字被切掉。
        */
        .sc-steps figure:nth-child(1).is-active,
        .sc-steps figure:nth-child(1):hover {
          transform: translateX(46px) translateY(-14px) rotate(0deg) scale(1.04); z-index: 4;
        }
        .sc-steps figure:nth-child(2).is-active,
        .sc-steps figure:nth-child(2):hover {
          transform: translateY(-14px) rotate(0deg) scale(1.04); z-index: 4;
        }
        .sc-steps figure:nth-child(3).is-active,
        .sc-steps figure:nth-child(3):hover {
          transform: translateX(-46px) translateY(-14px) rotate(0deg) scale(1.04); z-index: 4;
        }
        /* 觸控裝置沒有 hover，避免 :hover 樣式在 tap 後黏住 */
        @media (hover: none) {
          .sc-steps figure:nth-child(1):hover { transform: translateX(46px) translateY(74px) rotate(-5deg); z-index: 1; }
          .sc-steps figure:nth-child(2):hover { transform: none; z-index: 3; }
          .sc-steps figure:nth-child(3):hover { transform: translateX(-46px) translateY(88px) rotate(5deg); z-index: 2; }
          .sc-steps figure:nth-child(1).is-active { transform: translateX(46px) translateY(-14px) rotate(0deg) scale(1.04); z-index: 4; }
          .sc-steps figure:nth-child(2).is-active { transform: translateY(-14px) rotate(0deg) scale(1.04); z-index: 4; }
          .sc-steps figure:nth-child(3).is-active { transform: translateX(-46px) translateY(-14px) rotate(0deg) scale(1.04); z-index: 4; }
        }

        /* 螢幕放不下設計基準寬時，整組等比縮小——排法與互動完全保留 */
        @media (max-width: 640px) {
          .steps-scaler { --s: calc((100vw - 32px) / ${BASE_W}); }
        }
        @media (min-width: 641px) and (max-width: 900px) {
          .steps-scaler { --s: calc((100vw - 64px) / ${BASE_W}); }
        }

        @media (prefers-reduced-motion: reduce) {
          .sc-steps figure { transition: none; }
        }
      `}</style>
    </div>
  )
}
