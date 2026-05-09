import Link from 'next/link'

/* ─── LINE SVG ───────────────────────────────────────────── */
const LINE_PATH = "M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.630 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.630 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.070 9.436-6.975C23.176 14.393 24 12.458 24 10.314"
function LineIcon({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d={LINE_PATH}/></svg>
}

/* ─── NAVBAR ─────────────────────────────────────────────── */
function Nav() {
  return (
    <nav style={{
      position:'fixed',top:0,left:0,right:0,zIndex:100,
      padding:'0 48px',height:'68px',
      display:'flex',alignItems:'center',justifyContent:'space-between',
      backdropFilter:'blur(20px) saturate(150%)',
      WebkitBackdropFilter:'blur(20px) saturate(150%)',
      background:'rgba(26,23,20,0.72)',
      borderBottom:'1px solid rgba(166,137,102,0.20)',
    }}>
      <div style={{fontFamily:'var(--font-cormorant)',fontSize:'22px',fontWeight:600,letterSpacing:'0.1em',color:'var(--cream)'}}>
        Moo<span style={{color:'var(--oak)'}}>Lah</span>
      </div>
      <ul style={{display:'flex',gap:'36px',listStyle:'none',fontSize:'13px',letterSpacing:'0.10em',color:'rgba(251,249,244,0.65)'}}>
        {[['服務類別','#services'],['合作方案','/services'],['加入合作','/join']].map(([l,h])=>(
          <li key={l}><Link href={h} style={{color:'inherit',textDecoration:'none'}} className="nav-link">{l}</Link></li>
        ))}
      </ul>
      <a href="https://line.me/R/ti/p/@881zhkla" target="_blank" rel="noopener"
        style={{display:'flex',alignItems:'center',gap:'8px',background:'var(--line-green)',color:'#fff',
          padding:'9px 20px',borderRadius:'var(--radius-pill)',fontSize:'13px',fontWeight:500,
          letterSpacing:'0.05em',textDecoration:'none',transition:'opacity 0.2s'}}>
        <LineIcon size={15}/>立即預約
      </a>
    </nav>
  )
}

/* ─── HERO ───────────────────────────────────────────────── */
function Hero() {
  return (
    <section style={{position:'relative',minHeight:'100dvh',display:'flex',alignItems:'center',overflow:'hidden',background:'#1a1714'}}>
      <div style={{position:'absolute',inset:0,zIndex:0}}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1800&q=85&fit=crop"
          alt="Premium salon interior"
          style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center 30%',filter:'brightness(0.82) saturate(0.75)'}}/>
      </div>
      <div style={{position:'absolute',inset:0,zIndex:1,background:'linear-gradient(to right,#1a1714 38%,rgba(26,23,20,0.60) 65%,rgba(26,23,20,0.10) 100%)'}}/>
      <div style={{position:'relative',zIndex:2,maxWidth:'1200px',width:'100%',margin:'0 auto',padding:'120px 48px 80px',display:'flex',flexDirection:'column',gap:0}}>
        <div style={{fontSize:'11px',letterSpacing:'0.22em',textTransform:'uppercase',color:'var(--oak)',marginBottom:'28px',display:'flex',alignItems:'center',gap:'10px',fontWeight:400}}>
          <span style={{width:'32px',height:'1px',background:'var(--oak)',display:'block'}}/>
          Beauty Booking Platform
        </div>
        <h1 className="font-display" style={{fontSize:'clamp(52px,7.5vw,100px)',fontWeight:300,lineHeight:1.03,letterSpacing:'-0.01em',color:'var(--cream)',marginBottom:'28px',maxWidth:'680px'}}>
          質感生活，<br/><em style={{fontStyle:'italic',color:'var(--oak)'}}>從容預約</em>
        </h1>
        <p style={{fontSize:'16px',lineHeight:1.75,color:'rgba(251,249,244,0.65)',fontWeight:300,maxWidth:'440px',marginBottom:'48px'}}>
          LINE 一鍵預約，讓每次服務都成為享受。<br/>深度整合台灣美業，從此不再手忙腳亂。
        </p>
        <div style={{display:'flex',gap:'16px',alignItems:'center',flexWrap:'wrap'}}>
          <a href="https://line.me/R/ti/p/@881zhkla" target="_blank" rel="noopener"
            style={{display:'inline-flex',alignItems:'center',gap:'10px',background:'var(--line-green)',color:'#fff',
              padding:'14px 30px',borderRadius:'var(--radius-pill)',fontSize:'14px',fontWeight:500,
              letterSpacing:'0.04em',textDecoration:'none',transition:'transform 0.25s'}}>
            <LineIcon size={18}/>LINE 立即預約
          </a>
          <a href="#services"
            style={{display:'inline-flex',alignItems:'center',gap:'8px',padding:'14px 28px',
              border:'1px solid rgba(251,249,244,0.25)',borderRadius:'var(--radius-pill)',fontSize:'14px',
              color:'var(--cream)',letterSpacing:'0.04em',textDecoration:'none',transition:'border-color 0.25s'}}>
            探索服務
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} width={16} height={16}><path d="M4 10h12M12 6l4 4-4 4"/></svg>
          </a>
        </div>
      </div>
    </section>
  )
}

/* ─── MARQUEE ────────────────────────────────────────────── */
function Marquee() {
  const items = ['髮型設計','寵物美容','汽車美容','美甲藝術','LINE 即時通知','智慧時段管理','雙向預約確認','質感生活從容預約']
  const dot = <span style={{width:'4px',height:'4px',borderRadius:'50%',background:'rgba(251,249,244,0.45)',display:'inline-block'}}/>
  return (
    <div aria-hidden style={{padding:'22px 0',background:'var(--oak)',overflow:'hidden',position:'relative',zIndex:2}}>
      <div style={{display:'flex',width:'max-content',animation:'marqueeScroll 30s linear infinite'}}>
        {[...items,...items].map((t,i)=>(
          <span key={i} style={{display:'inline-flex',alignItems:'center',gap:'20px',padding:'0 32px',
            fontFamily:'var(--font-cormorant)',fontSize:'15px',fontWeight:500,letterSpacing:'0.12em',
            color:'var(--cream)',whiteSpace:'nowrap'}}>
            {t}{dot}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ─── SERVICES ───────────────────────────────────────────── */
const SERVICES = [
  {num:'01',cat:'髮型設計師',name:'Hair\nDesigner',desc:'剪髮、染髮、燙髮、護髮，由專業設計師為您打造專屬風格。',img:'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80&auto=format',href:'/go/chloe',cta:'立即預約 →'},
  {num:'02',cat:'寵物美容師',name:'Pet\nGrooming',desc:'專業洗澡、造型剪毛，讓毛孩子每天都美美的出門。',img:'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&q=80&auto=format',href:'',cta:'即將開放'},
  {num:'03',cat:'汽車美容師',name:'Auto\nDetailing',desc:'漆面鍍膜、內裝清潔、拋光整理，讓愛車煥然如新。',img:'https://images.unsplash.com/photo-1614027164847-1b28cfe1df60?w=600&q=80&auto=format',href:'',cta:'即將開放'},
  {num:'04',cat:'美甲師',name:'Nail\nArtist',desc:'凝膠美甲、光療、藝術彩繪，每一款都是獨一無二的創作。',img:'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=80&auto=format',href:'',cta:'即將開放'},
]

function Services() {
  return (
    <section id="services" style={{padding:'120px 0',background:'var(--charcoal)',position:'relative',zIndex:2}}>
      <div style={{maxWidth:'1200px',margin:'0 auto',padding:'0 48px'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'64px',alignItems:'end',marginBottom:'56px'}}>
          <div>
            <div style={{fontSize:'10px',letterSpacing:'0.22em',textTransform:'uppercase',color:'var(--oak)',fontWeight:500,marginBottom:'16px',display:'flex',alignItems:'center',gap:'10px'}}>
              服務類別<span style={{width:'40px',height:'1px',background:'var(--oak)',display:'block'}}/>
            </div>
            <h2 className="font-display" style={{fontSize:'clamp(36px,5vw,64px)',fontWeight:300,lineHeight:1.1,color:'var(--cream)'}}>
              四大美業，<br/><em style={{fontStyle:'italic',color:'var(--oak)'}}>一站預約</em>
            </h2>
          </div>
          <p style={{fontSize:'15px',lineHeight:1.78,color:'rgba(251,249,244,0.55)',fontWeight:300}}>
            從日常的髮型打理到愛車的精心養護，MooLah 整合台灣頂尖美業職人，讓每一次預約都成為生活中的從容儀式。
          </p>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'18px'}}>
          {SERVICES.map(s=>(
            <div key={s.num} style={{position:'relative',borderRadius:'var(--radius-xl)',overflow:'hidden',aspectRatio:'3/4',cursor:'pointer'}} className="service-card">
              <div className="service-card-img" style={{position:'absolute',inset:0,transition:'transform 0.7s var(--ease-expo)'}}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.img} alt={s.cat} loading="lazy"
                  style={{width:'100%',height:'100%',objectFit:'cover',filter:'saturate(0.7) brightness(0.72)',transition:'filter 0.5s'}}/>
              </div>
              <div style={{position:'absolute',inset:0,background:'linear-gradient(180deg,transparent 35%,rgba(20,16,12,0.92) 100%)'}}/>
              <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'26px 22px'}}>
                <div style={{fontSize:'10px',letterSpacing:'0.2em',color:'var(--oak)',marginBottom:'10px',fontWeight:400}}>{s.num} — {s.cat}</div>
                <div className="font-display" style={{fontSize:'23px',fontWeight:500,color:'var(--cream)',lineHeight:1.2,marginBottom:'8px',whiteSpace:'pre-line'}}>{s.name}</div>
                <div className="service-desc" style={{fontSize:'12px',color:'rgba(251,249,244,0.58)',lineHeight:1.6}}>{s.desc}</div>
                {s.href ? (
                  <Link href={s.href} style={{display:'inline-flex',alignItems:'center',gap:'6px',marginTop:'14px',padding:'5px 12px',
                    background:'rgba(251,249,244,0.10)',backdropFilter:'blur(12px)',border:'1px solid rgba(166,137,102,0.25)',
                    borderRadius:'var(--radius-pill)',fontSize:'11px',color:'var(--oak)',letterSpacing:'0.08em',textDecoration:'none'}}>
                    {s.cta}
                  </Link>
                ) : (
                  <span style={{display:'inline-flex',alignItems:'center',gap:'6px',marginTop:'14px',padding:'5px 12px',
                    background:'rgba(251,249,244,0.10)',backdropFilter:'blur(12px)',border:'1px solid rgba(166,137,102,0.25)',
                    borderRadius:'var(--radius-pill)',fontSize:'11px',color:'var(--oak)',letterSpacing:'0.08em'}}>
                    {s.cta}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── STORY CHAPTERS ─────────────────────────────────────── */
function PointIcon({ children }: { children: React.ReactNode }) {
  return (
    <div style={{width:'36px',height:'36px',borderRadius:'var(--radius-md)',background:'rgba(166,137,102,0.15)',
      border:'1px solid rgba(166,137,102,0.35)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:'var(--oak)'}}>
      {children}
    </div>
  )
}

function Badge({ items }: { items: React.ReactNode }) {
  return (
    <div style={{position:'absolute',bottom:'24px',left:'24px',right:'24px',borderRadius:'var(--radius-lg)',padding:'18px 20px',
      backdropFilter:'blur(20px) saturate(150%)',WebkitBackdropFilter:'blur(20px) saturate(150%)',
      background:'rgba(255,255,255,0.60)',border:'1px solid rgba(166,137,102,0.22)',
      boxShadow:'0 8px 40px rgba(44,40,37,0.10),0 1px 0 rgba(255,255,255,0.8) inset'}}>
      {items}
    </div>
  )
}

function Chapters() {
  const ch1Points = [
    {icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={16} height={16}><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,title:'節省每日 2+ 小時行政時間',body:'自動化預約確認、提醒、通知，零人工操作'},
    {icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={16} height={16}><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>,title:'LINE 雙向即時通知',body:'預約確認、取消、變更，客戶與設計師同步收到'},
    {icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={16} height={16}><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>,title:'智慧時段管理',body:'依服務時長動態調整可預約時段，有效減少空窗'},
  ]
  const ch2Points = [
    {icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={16} height={16}><path d="M4 6h16M4 12h8m-8 6h16"/></svg>,title:'職人作品集展示',body:'精美個人頁面，展現每位職人的風格與專業'},
    {icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={16} height={16}><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,title:'GPS 地圖搜尋附近職人',body:'官網提供地理位置篩選，快速找到附近優質服務'},
    {icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={16} height={16}><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,title:'透明定價、無隱藏費用',body:'所有服務項目與價格清晰呈現，預約前完整了解'},
  ]
  const ch3Points = [
    {icon:<LineIcon size={16}/>,title:'LINE OA 官方帳號整合',body:'每位職人擁有獨立 LIFF 預約頁，透過 LINE 分享直達'},
    {icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={16} height={16}><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>,title:'Cron 每日推播排程',body:'每早 08:00 自動推送當日預約摘要至設計師 LINE'},
    {icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={16} height={16}><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>,title:'短連結快速部署',body:'每位新職人只需填寫 Google Sheets，即可獲得專屬短連結'},
  ]

  const barHeights = ['40%','55%','48%','62%','70%','100%']

  function StoryPoints({points,bg='#f5efe6'}:{points:typeof ch1Points,bg?:string}) {
    const light = bg === '#f5efe6' || bg === '#ede8dc'
    return (
      <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
        {points.map(p=>(
          <div key={p.title} style={{display:'flex',alignItems:'flex-start',gap:'14px',padding:'16px 18px',
            background:light?'rgba(166,137,102,0.08)':'rgba(166,137,102,0.06)',
            border:`1px solid ${light?'rgba(166,137,102,0.16)':'rgba(166,137,102,0.12)'}`,
            borderRadius:'var(--radius-md)'}}>
            <PointIcon>{p.icon}</PointIcon>
            <div>
              <h4 style={{fontSize:'14px',fontWeight:500,color:light?'var(--charcoal)':'var(--cream)',marginBottom:'4px'}}>{p.title}</h4>
              <p style={{fontSize:'13px',color:light?'rgba(44,40,37,0.52)':'rgba(251,249,244,0.50)',lineHeight:1.55}}>{p.body}</p>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const chStyle = (bg:string) => ({padding:'120px 0',borderBottom:'1px solid rgba(166,137,102,0.14)',background:bg,position:'relative',zIndex:2} as const)
  const gridStyle = (reverse?:boolean) => ({display:'grid',gridTemplateColumns:'1fr 1fr',gap:'80px',alignItems:'center', ...(reverse?{direction:'rtl' as const}:{})})
  const innerStyle = {maxWidth:'1200px',margin:'0 auto',padding:'0 48px'}
  const visualStyle = {position:'relative',borderRadius:'var(--radius-xl)',overflow:'hidden',aspectRatio:'4/5'} as const
  const lightKicker = {fontSize:'10px',letterSpacing:'0.24em',color:'var(--oak)',textTransform:'uppercase' as const,fontWeight:500,marginBottom:'20px'}
  const lightTitle = {fontFamily:'var(--font-cormorant)',fontSize:'clamp(30px,4vw,52px)',fontWeight:300,lineHeight:1.12,color:'var(--charcoal)',marginBottom:'24px'}
  const lightBody = {fontSize:'15px',lineHeight:1.8,color:'rgba(44,40,37,0.62)',fontWeight:300,marginBottom:'36px'}

  return (
    <section style={{position:'relative',zIndex:2}}>
      {/* Ch1 */}
      <div style={chStyle('#f5efe6')}>
        <div style={innerStyle}>
          <div style={gridStyle()}>
            <div style={visualStyle}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&q=85&auto=format" alt="髮型設計背面" loading="lazy"
                style={{width:'100%',height:'100%',objectFit:'cover',filter:'saturate(0.75)'}}/>
              <Badge items={
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div>
                    <div style={{fontSize:'11px',color:'rgba(44,40,37,0.48)',letterSpacing:'0.1em',marginBottom:'6px'}}>本月預約量</div>
                    <div className="font-display" style={{fontSize:'26px',fontWeight:600,color:'var(--charcoal)',lineHeight:1}}>248</div>
                    <div style={{fontSize:'11px',color:'var(--oak)',letterSpacing:'0.06em',marginTop:'4px'}}>比上月 +34%</div>
                  </div>
                  <div style={{display:'flex',alignItems:'flex-end',gap:'4px',height:'36px'}}>
                    {barHeights.map((h,i)=><div key={i} style={{width:'6px',borderRadius:'3px',background:'var(--oak)',opacity:i===5?1:0.4,height:h}}/>)}
                  </div>
                </div>
              }/>
            </div>
            <div style={{direction:'ltr'}}>
              <div style={lightKicker}>Chapter 01 — 職人的挑戰</div>
              <h2 className="font-display" style={lightTitle}>優秀的職人，<br/>不該被<em style={{fontStyle:'italic',color:'var(--oak)'}}>行政雜務</em>拖累</h2>
              <p style={lightBody}>每天回覆無數則預約訊息、手動整理行事曆、擔心漏單——這些不是你應該花時間的地方。MooLah 讓你專注在作品本身。</p>
              <StoryPoints points={ch1Points} bg="#f5efe6"/>
            </div>
          </div>
        </div>
      </div>

      {/* Ch2 */}
      <div style={chStyle('#ede8dc')}>
        <div style={innerStyle}>
          <div style={gridStyle(true)}>
            <div style={visualStyle}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://images.unsplash.com/photo-1499952127939-9bbf5af6c51c?w=800&q=85&auto=format" alt="客戶體驗" loading="lazy"
                style={{width:'100%',height:'100%',objectFit:'cover',filter:'saturate(0.70)'}}/>
              <Badge items={
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div>
                    <div style={{fontSize:'11px',color:'rgba(44,40,37,0.48)',letterSpacing:'0.1em',marginBottom:'6px'}}>回頭客比例</div>
                    <div className="font-display" style={{fontSize:'26px',fontWeight:600,color:'var(--charcoal)',lineHeight:1}}>76%</div>
                    <div style={{fontSize:'11px',color:'var(--oak)',letterSpacing:'0.06em',marginTop:'4px'}}>客戶留存率</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:'11px',color:'rgba(44,40,37,0.48)',letterSpacing:'0.1em',marginBottom:'6px'}}>服務評分</div>
                    <div style={{color:'var(--oak)',fontSize:'15px',margin:'6px 0 3px'}}>★★★★★</div>
                    <div style={{fontSize:'11px',color:'rgba(44,40,37,0.45)'}}>4.9 / 5.0</div>
                  </div>
                </div>
              }/>
            </div>
            <div style={{direction:'ltr'}}>
              <div style={lightKicker}>Chapter 02 — 客戶的體驗</div>
              <h2 className="font-display" style={lightTitle}>一鍵預約，<br/><em style={{fontStyle:'italic',color:'var(--oak)'}}>質感</em>服務隨傳即到</h2>
              <p style={lightBody}>客戶不需要下載 App、不需要打電話等候——只需透過 LINE 輕鬆瀏覽職人作品集、選擇服務、確認時段，三步完成預約。</p>
              <StoryPoints points={ch2Points} bg="#ede8dc"/>
            </div>
          </div>
        </div>
      </div>

      {/* Ch3 */}
      <div style={{...chStyle('#f5efe6'),borderBottom:'none'}}>
        <div style={innerStyle}>
          <div style={gridStyle()}>
            <div style={visualStyle}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&q=85&auto=format" alt="LINE 整合" loading="lazy"
                style={{width:'100%',height:'100%',objectFit:'cover',filter:'saturate(0.70)'}}/>
              <Badge items={
                <div>
                  <div style={{fontSize:'11px',color:'rgba(44,40,37,0.48)',letterSpacing:'0.1em'}}>每日推播時間</div>
                  <div className="font-display" style={{fontSize:'26px',fontWeight:600,color:'var(--charcoal)',margin:'6px 0 2px'}}>08:00</div>
                  <div style={{fontSize:'11px',color:'var(--oak)'}}>設計師當日排程通知</div>
                  <div style={{marginTop:'14px',paddingTop:'12px',borderTop:'1px solid rgba(166,137,102,0.18)'}}>
                    <div style={{fontSize:'11px',color:'rgba(44,40,37,0.42)',marginBottom:'8px'}}>今日行程摘要</div>
                    {[{c:'#4ade80',t:'10:00 — 陳小姐 剪髮護染'},{c:'var(--oak)',t:'14:30 — 王先生 燙髮造型'}].map(x=>(
                      <div key={x.t} style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'12px',color:'rgba(44,40,37,0.70)',marginBottom:'6px'}}>
                        <div style={{width:'6px',height:'6px',borderRadius:'50%',background:x.c,flexShrink:0}}/>{x.t}
                      </div>
                    ))}
                  </div>
                </div>
              }/>
            </div>
            <div>
              <div style={lightKicker}>Chapter 03 — 平台的力量</div>
              <h2 className="font-display" style={lightTitle}>LINE 生態系，<br/><em style={{fontStyle:'italic',color:'var(--oak)'}}>無縫整合</em>台灣日常</h2>
              <p style={lightBody}>台灣 90% 以上的手機用戶每天使用 LINE。MooLah 深度整合 LINE 平台，讓預約流程融入客戶的日常生活，零摩擦、高轉換。</p>
              <StoryPoints points={ch3Points} bg="#f5efe6"/>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── VALUES ─────────────────────────────────────────────── */
const VALUES = [
  {num:'01',title:'職人值得被看見',desc:'每一位認真對待工作的美業職人，都應該有展示自己作品的舞台，而不是被埋沒在社群演算法裡。MooLah 為職人打造專業形象。'},
  {num:'02',title:'預約是一種儀式',desc:'一次好的預約體驗，是對服務的期待，是生活品質的體現。我們讓每個預約的瞬間都充滿從容與質感，而非焦急等待。'},
  {num:'03',title:'科技服務於人',desc:'最好的科技是讓人感覺不到科技存在。MooLah 融入 LINE 日常生活，用最熟悉的方式，完成最順暢的預約。'},
]

function Values() {
  return (
    <section style={{padding:'140px 0',background:'var(--charcoal)',position:'relative',zIndex:2}}>
      <div style={{maxWidth:'1200px',margin:'0 auto',padding:'0 48px'}}>
        <div style={{textAlign:'center',marginBottom:'72px'}}>
          <div style={{fontSize:'10px',letterSpacing:'0.22em',textTransform:'uppercase',color:'var(--oak)',fontWeight:500,marginBottom:'16px',display:'flex',alignItems:'center',justifyContent:'center',gap:'10px'}}>
            品牌理念<span style={{width:'40px',height:'1px',background:'var(--oak)',display:'block'}}/>
          </div>
          <h2 className="font-display" style={{fontSize:'clamp(36px,5vw,64px)',fontWeight:300,lineHeight:1.1,color:'var(--cream)'}}>
            我們相信的<em style={{fontStyle:'italic',color:'var(--oak)'}}>三件事</em>
          </h2>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'22px'}}>
          {VALUES.map(v=>(
            <div key={v.num} className="value-card" style={{padding:'40px 34px',background:'rgba(251,249,244,0.05)',
              backdropFilter:'blur(16px)',WebkitBackdropFilter:'blur(16px)',border:'1px solid rgba(166,137,102,0.18)',
              borderRadius:'var(--radius-xl)',transition:'transform 0.35s var(--ease-silk),box-shadow 0.35s,border-color 0.35s',position:'relative',overflow:'hidden'}}>
              <div className="font-display" style={{fontSize:'62px',fontWeight:300,color:'rgba(166,137,102,0.30)',lineHeight:1,marginBottom:'18px'}}>{v.num}</div>
              <div className="font-display" style={{fontSize:'26px',fontWeight:500,color:'var(--cream)',marginBottom:'14px'}}>{v.title}</div>
              <p style={{fontSize:'14px',lineHeight:1.75,color:'rgba(251,249,244,0.52)',fontWeight:300}}>{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── MEMBERSHIP CTA ─────────────────────────────────────── */
function Membership() {
  const guarantees = [
    {icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={14} height={14}><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>,text:'免費開始，無平台費'},
    {icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={14} height={14}><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,text:'5 分鐘完成建檔'},
    {icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={14} height={14}><path d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"/></svg>,text:'LINE 雙向通知'},
    {icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={14} height={14}><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>,text:'即開即用'},
  ]
  return (
    <section style={{padding:'140px 0',background:'var(--sand)',overflow:'hidden',position:'relative',zIndex:2}}>
      <div style={{maxWidth:'1200px',margin:'0 auto',padding:'0 48px',position:'relative'}}>
        <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:'800px',height:'600px',
          background:'radial-gradient(ellipse at center,rgba(166,137,102,0.14) 0%,transparent 70%)',pointerEvents:'none'}}/>
        <div style={{position:'relative',background:'rgba(255,255,255,0.55)',backdropFilter:'blur(30px) saturate(130%)',
          WebkitBackdropFilter:'blur(30px) saturate(130%)',border:'1px solid rgba(166,137,102,0.22)',
          borderRadius:'32px',padding:'80px',textAlign:'center',overflow:'hidden',
          boxShadow:'0 16px 60px rgba(44,40,37,0.10),0 1px 0 rgba(255,255,255,0.9) inset'}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:'8px',padding:'6px 16px',
            background:'rgba(166,137,102,0.12)',border:'1px solid rgba(166,137,102,0.30)',
            borderRadius:'var(--radius-pill)',fontSize:'10px',letterSpacing:'0.2em',textTransform:'uppercase',
            color:'var(--oak)',fontWeight:500,marginBottom:'32px'}}>
            <svg viewBox="0 0 16 16" fill="currentColor" width={11} height={11}><path d="M8 0L9.8 5.4H15.6L10.9 8.6L12.7 14L8 10.8L3.3 14L5.1 8.6L0.4 5.4H6.2Z"/></svg>
            加入 MooLah 合作職人
          </div>
          <h2 className="font-display" style={{fontSize:'clamp(38px,5.5vw,68px)',fontWeight:300,lineHeight:1.08,color:'var(--charcoal)',marginBottom:'22px'}}>
            讓你的才華，<br/>觸及<em style={{fontStyle:'italic',color:'var(--oak)'}}>更多人</em>
          </h2>
          <p style={{fontSize:'16px',lineHeight:1.72,color:'rgba(44,40,37,0.58)',fontWeight:300,maxWidth:'540px',margin:'0 auto 52px'}}>
            免費建立專業個人頁面，透過 LINE 接收預約，讓 MooLah 的智慧系統處理所有行政細節。你只需要專注在你最擅長的事。
          </p>
          <div style={{display:'flex',gap:'16px',justifyContent:'center',flexWrap:'wrap'}}>
            <a href="https://line.me/R/ti/p/@881zhkla" target="_blank" rel="noopener"
              style={{display:'inline-flex',alignItems:'center',gap:'10px',background:'var(--line-green)',color:'#fff',
                padding:'16px 36px',borderRadius:'var(--radius-pill)',fontSize:'14px',fontWeight:500,
                letterSpacing:'0.04em',textDecoration:'none',transition:'transform 0.25s'}}>
              <LineIcon size={18}/>LINE 立即預約體驗
            </a>
            <Link href="/join"
              style={{display:'inline-flex',alignItems:'center',gap:'10px',background:'var(--oak)',color:'var(--cream)',
                padding:'16px 36px',borderRadius:'var(--radius-pill)',fontSize:'14px',fontWeight:500,
                letterSpacing:'0.06em',textDecoration:'none',transition:'transform 0.25s'}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={18} height={18}><path d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
              申請加入合作
            </Link>
          </div>
          <div style={{display:'flex',justifyContent:'center',gap:'36px',marginTop:'44px',flexWrap:'wrap'}}>
            {guarantees.map(g=>(
              <div key={g.text} style={{display:'flex',alignItems:'center',gap:'7px',fontSize:'12px',color:'rgba(44,40,37,0.45)',letterSpacing:'0.05em'}}>
                <span style={{color:'var(--oak)'}}>{g.icon}</span>{g.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── PARTNERS ───────────────────────────────────────────── */
function Partners() {
  const pills = ['髮型設計','寵物美容','汽車美容','美甲藝術','LINE 整合','Google Sheets 管理']
  return (
    <section style={{padding:'72px 0',background:'#1e1b17',borderTop:'1px solid rgba(166,137,102,0.10)',position:'relative',zIndex:2}}>
      <div style={{maxWidth:'1200px',margin:'0 auto',padding:'0 48px'}}>
        <p style={{textAlign:'center',fontSize:'10px',letterSpacing:'0.2em',textTransform:'uppercase',color:'rgba(251,249,244,0.30)',marginBottom:'36px'}}>合作職人覆蓋類別</p>
        <div style={{display:'flex',justifyContent:'center',gap:'16px',flexWrap:'wrap',alignItems:'center'}}>
          {pills.map(p=>(
            <div key={p} style={{display:'flex',alignItems:'center',gap:'8px',padding:'9px 20px',
              background:'rgba(251,249,244,0.03)',border:'1px solid rgba(166,137,102,0.12)',
              borderRadius:'var(--radius-pill)',fontFamily:'var(--font-cormorant)',fontSize:'14px',
              fontWeight:500,color:'rgba(251,249,244,0.35)',letterSpacing:'0.08em'}}>
              <div style={{width:'5px',height:'5px',borderRadius:'50%',background:'var(--oak)',opacity:0.45}}/>
              {p}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── FOOTER ─────────────────────────────────────────────── */
function Footer() {
  return (
    <footer style={{background:'#0e0c0a',padding:'80px 0 44px',borderTop:'1px solid rgba(166,137,102,0.10)'}}>
      <div style={{maxWidth:'1200px',margin:'0 auto',padding:'0 48px'}}>
        <div style={{display:'grid',gridTemplateColumns:'260px 1fr 1fr 1fr',gap:'64px',paddingBottom:'56px',borderBottom:'1px solid rgba(166,137,102,0.10)',marginBottom:'36px'}}>
          <div>
            <h2 className="font-display" style={{fontSize:'24px',fontWeight:600,letterSpacing:'0.08em',color:'var(--cream)',marginBottom:'4px'}}>
              Moo<span style={{color:'var(--oak)'}}>Lah</span>
            </h2>
            <p style={{fontSize:'11px',color:'rgba(251,249,244,0.35)',letterSpacing:'0.10em',marginBottom:'22px'}}>質感生活，從容預約</p>
            <a href="https://line.me/R/ti/p/@881zhkla" target="_blank" rel="noopener"
              style={{display:'inline-flex',alignItems:'center',gap:'7px',padding:'9px 18px',background:'var(--line-green)',color:'#fff',borderRadius:'var(--radius-pill)',fontSize:'12px',fontWeight:500,textDecoration:'none',transition:'opacity 0.2s'}}>
              <LineIcon size={13}/>加入 LINE OA
            </a>
          </div>
          {[
            {h:'服務',links:[['髮型設計預約','/go/chloe'],['寵物美容','/'],['汽車美容','/'],['美甲師','/']]},
            {h:'平台',links:[['合作方案','/services'],['加入合作','/join'],['常見問題','/services#faq'],['聯絡我們','mailto:gini30666@gmail.com']]},
            {h:'關於',links:[['品牌故事','/'],['LINE 官方帳號','https://line.me/R/ti/p/@881zhkla'],['商務合作','mailto:gini30666@gmail.com']]},
          ].map(col=>(
            <div key={col.h}>
              <h4 style={{fontSize:'10px',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--oak)',fontWeight:500,marginBottom:'18px'}}>{col.h}</h4>
              <ul style={{listStyle:'none',display:'flex',flexDirection:'column',gap:'11px'}}>
                {col.links.map(([l,h])=>(
                  <li key={l}><a href={h} style={{fontSize:'13px',color:'rgba(251,249,244,0.40)',textDecoration:'none',transition:'color 0.2s'}}>{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <p style={{fontSize:'12px',color:'rgba(251,249,244,0.22)'}}>© 2026 MooLah. 高雄，台灣 — 設計 × 技術 by <a href="mailto:gini30666@gmail.com" style={{color:'var(--oak)'}}>Gini Chen</a></p>
          <div style={{display:'flex',gap:'20px'}}>
            {['隱私權政策','服務條款'].map(t=><a key={t} href="#" style={{fontSize:'12px',color:'rgba(251,249,244,0.22)',textDecoration:'none',transition:'color 0.2s'}}>{t}</a>)}
          </div>
        </div>
      </div>
    </footer>
  )
}

/* ─── PAGE ───────────────────────────────────────────────── */
export default function HomePage() {
  return (
    <>
      <style>{`
        @keyframes marqueeScroll { from { transform:translateX(0); } to { transform:translateX(-50%); } }
        @media (prefers-reduced-motion:reduce) { [style*="marqueeScroll"] { animation:none; } }
        .service-card:hover .service-card-img { transform:scale(1.06); }
        .service-card:hover .service-card-img img { filter:saturate(0.85) brightness(0.78) !important; }
        .service-card:hover .service-desc { max-height:64px !important; opacity:1 !important; }
        .service-desc { max-height:0; overflow:hidden; transition:max-height 0.5s,opacity 0.4s; opacity:0; }
        .value-card:hover { transform:translateY(-6px); box-shadow:0 24px 60px rgba(44,40,37,0.32); border-color:rgba(166,137,102,0.40) !important; }
        nav .nav-link:hover { color:var(--oak) !important; }
      `}</style>
      <Nav />
      <main style={{paddingTop:'68px'}}>
        <Hero />
        <Marquee />
        <Services />
        <Chapters />
        <Values />
        <Membership />
        <Partners />
      </main>
      <Footer />
    </>
  )
}
