import { describe, it, expect } from 'vitest'
import { buildDataBundleText, type ProviderData } from './aiBundle'

const sample: ProviderData = {
  today: '2026-06-29',
  upcoming: [
    { date: '2026-06-29', time: '10:00', customerName: '小明', customerPhone: '0968081521', serviceName: '剪髮' },
    { date: '2026-06-30', time: '14:00', customerName: '小華', customerPhone: '', serviceName: '染髮' },
  ],
  weekStats: { range: '06-22 – 06-28', confirmed: 1, completed: 2, cancelled: 1, noShow: 0, revenue: 2400 },
  monthStats: { ym: '2026-06', confirmed: 3, completed: 5, cancelled: 2, noShow: 1, revenue: 8800 },
  services: [
    { name: '剪髮', price: 800, duration: 60 },
    { name: '染髮', price: 1600, duration: 120 },
  ],
  recentCustomers: [{ name: '小明', visits: 3 }, { name: '小華', visits: 1 }],
}

describe('buildDataBundleText', () => {
  it('包含未來預約、本週/本月統計、服務價格、客人', () => {
    const text = buildDataBundleText(sample)
    expect(text).toContain('2026-06-29 10:00')
    expect(text).toContain('小明')
    expect(text).toContain('0968081521')
    expect(text).toContain('剪髮')
    expect(text).toContain('800')
    expect(text).toContain('06-22 – 06-28')
    expect(text).toContain('2026-06')
    expect(text).toContain('2,400')   // 本週營收千分位
    expect(text).toContain('今天：2026-06-29')
  })

  it('未來預約為空時顯示「無」', () => {
    const text = buildDataBundleText({ ...sample, upcoming: [] })
    expect(text).toContain('未來預約：無')
  })
})
