import { NextResponse } from 'next/server'
import { appendRow } from '@/lib/sheets'
import { rateLimit, clientIp } from '@/lib/rateLimit'
import { sendCapiEvent, capiUserFromRequest } from '@/lib/metaCapi'
import { pushMessage } from '@/lib/line'

export async function POST(req: Request) {
  try {
    if (!rateLimit(`leads:${clientIp(req)}`, 5, 60_000)) {
      return NextResponse.json({ error: 'rate_limited', message: '操作太頻繁，請稍後再試。' }, { status: 429 })
    }
    const {
      name, category, district, contact, currentMethod, plan,
      eventId, attribution, ctaVariant,
    } = await req.json()
    // 前端 JoinForm 只把「姓名＋聯絡方式」設為必填（服務類別/地區為選填，Day 53 降門檻）
    // → 後端驗證需對齊，否則職人只填姓名+電話會被擋成 400「送出失敗」＝招商漏斗破洞
    if (!name?.trim() || !contact?.trim()) {
      return NextResponse.json({ error: 'missing fields' }, { status: 400 })
    }

    const id = `lead-${Date.now()}`
    const createdAt = new Date().toISOString()  // timestamptz 欄位需 ISO（原本 toLocaleString 的「上午/下午」會讓 Postgres 解析失敗→500）
    // plan：trial=14 天免費試用（預設）／direct=直接正式加入（免試用）
    const planChoice = plan === 'direct' ? 'direct' : 'trial'

    const a = (attribution ?? {}) as Record<string, string | undefined>
    // ⚠️ 欄位順序必須與 sheets.ts 的 TABLE_COLS.leads 完全一致（A:R 共 18 欄）
    await appendRow('leads!A:R', [
      id, name.trim(), category || '', district || '', contact.trim(),
      currentMethod || '', createdAt, 'new', planChoice,
      a.utmSource || '', a.utmMedium || '', a.utmCampaign || '', a.utmContent || '',
      a.referrer || '', a.landingPath || '', a.fbp || '', a.fbc || '',
      ctaVariant ? `cta=${ctaVariant}` : '',
    ])

    // ── 追蹤與通知：任何一項失敗都不能讓表單送出變成錯誤 ──────────────
    // 一律用 allSettled，且在 catch 裡吞掉；職人那端已經看到「申請已送出」了。

    // ① Meta CAPI：與前端 fbq('Lead') 同一個 eventId → Meta 去重
    //    這是 zuzu 8/6 那筆漏掉的補救 —— 她的瀏覽器 Pixel 被擋，只靠前端等於沒發生
    const capi = sendCapiEvent('lead', {
      ...capiUserFromRequest(req),
      // contact 欄位可能是電話也可能是 LINE ID；是電話才有比對價值
      phone: /\d{8,}/.test(contact) ? contact : undefined,
      externalId: id,
      fbp: a.fbp || capiUserFromRequest(req).fbp,
      fbc: a.fbc || capiUserFromRequest(req).fbc,
    }, {
      eventId: typeof eventId === 'string' ? eventId : undefined,
      eventSourceUrl: a.landingPath ? `https://moolah.studio${a.landingPath}` : undefined,
      customData: {
        content_category: category || '(未填)',
        plan: planChoice,
        utm_campaign: a.utmCampaign || '(none)',
        utm_content: a.utmContent || '(none)',
      },
    })

    // ② 即時通知業務 —— 2026-08-06 的教訓：
    //    艾里歐 8/3 進線、躺了三天沒人接，8/6 掃描才發現，他已經選了別家。
    //    每個 lead 的獲客成本約 NT$2,070，沒有通知就是花錢買客戶然後放到爛。
    const ops = process.env.OPS_LINE_USER_ID
    const notify = ops
      ? pushMessage(ops, [
          '🔔 新招商 Lead',
          `稱呼：${name.trim()}`,
          `聯絡：${contact.trim()}`,
          category ? `類別：${category}` : null,
          district ? `地區：${district}` : null,
          currentMethod ? `現況：${currentMethod}` : null,
          `方案：${planChoice === 'direct' ? '直接正式加入' : '14 天試用'}`,
          a.utmCampaign || a.utmSource
            ? `來源：${a.utmSource || '?'} / ${a.utmCampaign || '?'} / ${a.utmContent || '-'}`
            : '來源：自然流量',
          '',
          '⏱ 30 分鐘內完成第一次聯絡',
        ].filter(Boolean).join('\n'))
      : Promise.resolve(false)

    await Promise.allSettled([capi, notify])

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[leads]', e)
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
