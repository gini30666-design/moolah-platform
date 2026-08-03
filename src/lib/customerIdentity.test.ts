import { describe, it, expect } from 'vitest'
import { normalizePhone, normalizeName, isSameCustomer, customerKey } from './customerIdentity'

// 這組測試守的是「黑名單擋不擋得住換名字的人」——
// 2026-08-01 有訪客以假名假電話從網頁下單，當時系統只比對姓名，改個名字就繞過。
// 電話比對是唯一的防線，所以它的行為必須被鎖住。

describe('normalizePhone', () => {
  it('去掉空白、破折號、括號', () => {
    expect(normalizePhone('0912-345-678')).toBe('0912345678')
    expect(normalizePhone('0912 345 678')).toBe('0912345678')
    expect(normalizePhone('(0912)345678')).toBe('0912345678')
  })
  it('國碼轉本地格式', () => {
    expect(normalizePhone('+886912345678')).toBe('0912345678')
    expect(normalizePhone('886912345678')).toBe('0912345678')
    expect(normalizePhone('+886-912-345-678')).toBe('0912345678')
  })
  it('空值不炸', () => {
    expect(normalizePhone(null)).toBe('')
    expect(normalizePhone(undefined)).toBe('')
    expect(normalizePhone('')).toBe('')
  })
})

describe('normalizeName', () => {
  it('去空白轉小寫', () => {
    expect(normalizeName('王 小明')).toBe('王小明')
    expect(normalizeName(' Amy ')).toBe('amy')
  })
})

describe('isSameCustomer', () => {
  it('LINE userId 相同即同一人', () => {
    expect(isSameCustomer({ lineUserId: 'U123' }, { lineUserId: 'U123' })).toBe(true)
    expect(isSameCustomer({ lineUserId: 'U123' }, { lineUserId: 'U999' })).toBe(false)
  })

  it('★ 換名字但同電話 → 仍判定同一人（黑名單的核心防線）', () => {
    expect(isSameCustomer(
      { name: '開看看', phone: '0985555555' },
      { name: '換個名字', phone: '0985555555' },
    )).toBe(true)
  })

  it('★ 電話格式不同但實為同一支 → 仍擋得住', () => {
    expect(isSameCustomer(
      { name: 'A', phone: '+886985555555' },
      { name: 'B', phone: '0985-555-555' },
    )).toBe(true)
  })

  it('電話不同即不同人，不因同名而誤擋', () => {
    expect(isSameCustomer(
      { name: '王小明', phone: '0911111111' },
      { name: '王小明', phone: '0922222222' },
    )).toBe(false)
  })

  it('兩邊都沒有電話與 LINE ID 時，才退回姓名比對（向後相容舊資料）', () => {
    expect(isSameCustomer({ name: '王小明' }, { name: '王 小明' })).toBe(true)
    expect(isSameCustomer({ name: '王小明' }, { name: '李小華' })).toBe(false)
  })

  it('完全沒有識別資訊時不視為同一人', () => {
    expect(isSameCustomer({}, {})).toBe(false)
    expect(isSameCustomer({ name: '' }, { name: '' })).toBe(false)
  })
})

describe('customerKey', () => {
  it('有 LINE ID 就用它', () => {
    expect(customerKey({ lineUserId: 'U123', phone: '0912345678' })).toBe('U123')
  })
  it('沒有 LINE ID 時退回電話前綴鍵（讓 web 訪客也能有備註）', () => {
    expect(customerKey({ phone: '0912-345-678' })).toBe('phone:0912345678')
  })
  it('兩者皆無回空字串', () => {
    expect(customerKey({ name: '只有名字' })).toBe('')
  })
})
