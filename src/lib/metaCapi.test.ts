import { describe, it, expect } from 'vitest'
import { normalizePhoneE164 } from './metaCapi'
import { newEventId, META_EVENT, GA_EVENT } from './funnel'

// 這支測的是「錯了不會噴錯、只會靜默失效」的兩件事：
//   1. 電話正規化 —— 格式錯 → Meta 比對率 0 → 事件收到了卻歸因不到任何廣告
//   2. event_id   —— 前後端不一致 → 同一個轉換被算兩次

describe('normalizePhoneE164', () => {
  it('台灣手機加上國碼並去掉開頭 0', () => {
    expect(normalizePhoneE164('0911405457')).toBe('886911405457')
  })

  it('各種分隔符號都要吃掉', () => {
    expect(normalizePhoneE164('0911-405-457')).toBe('886911405457')
    expect(normalizePhoneE164('0911 405 457')).toBe('886911405457')
    expect(normalizePhoneE164('(09) 1140-5457')).toBe('886911405457')
  })

  it('已經有國碼的不要重複加', () => {
    expect(normalizePhoneE164('886911405457')).toBe('886911405457')
    expect(normalizePhoneE164('+886 911 405 457')).toBe('886911405457')
  })

  it('沒有開頭 0 的九碼手機也要補國碼', () => {
    expect(normalizePhoneE164('911405457')).toBe('886911405457')
  })

  it('★ 真實資料：contact 欄位常是「LINE ID + 電話」的混合字串', () => {
    // zuzu 那筆的實際內容就是這種格式
    expect(normalizePhoneE164('Line: zuzuyo  電話：0911405457')).toBe('886911405457')
  })

  it('市話也處理', () => {
    expect(normalizePhoneE164('08-8661234')).toBe('88688661234')
  })

  it('空值與純文字回 undefined（不能送垃圾給 Meta）', () => {
    expect(normalizePhoneE164('')).toBeUndefined()
    expect(normalizePhoneE164(null)).toBeUndefined()
    expect(normalizePhoneE164(undefined)).toBeUndefined()
    expect(normalizePhoneE164('zuzuyo')).toBeUndefined()
    expect(normalizePhoneE164('123')).toBeUndefined()   // 太短，不是電話
  })
})

describe('newEventId', () => {
  it('帶得出階段名，方便在 Events Manager 裡肉眼分辨', () => {
    expect(newEventId('lead').startsWith('lead.')).toBe(true)
    expect(newEventId('contact').startsWith('contact.')).toBe(true)
  })

  it('每次都不同 —— 相同的話 Meta 會把不同人的轉換去重掉', () => {
    const ids = new Set(Array.from({ length: 200 }, () => newEventId('lead')))
    expect(ids.size).toBe(200)
  })
})

describe('事件階梯對照表', () => {
  it('七個階段都要有 Meta 與 GA4 的對應名稱', () => {
    const stages = ['view', 'engaged', 'contact', 'lead', 'trial', 'activated', 'paid'] as const
    for (const s of stages) {
      expect(META_EVENT[s], `META_EVENT.${s}`).toBeTruthy()
      expect(GA_EVENT[s], `GA_EVENT.${s}`).toBeTruthy()
    }
  })

  it('★ 既有 GA4 事件名不可更動 —— 報表與 Google Ads 匯入的轉換都綁在這兩個名字上', () => {
    expect(GA_EVENT.contact).toBe('click_line_oa')
    expect(GA_EVENT.lead).toBe('generate_lead')
  })

  it('能用 Meta 標準事件的就不要自訂（標準事件模型才認得）', () => {
    expect(META_EVENT.view).toBe('ViewContent')
    expect(META_EVENT.contact).toBe('Contact')
    expect(META_EVENT.lead).toBe('Lead')
    expect(META_EVENT.trial).toBe('StartTrial')
    expect(META_EVENT.paid).toBe('Subscribe')
  })
})
