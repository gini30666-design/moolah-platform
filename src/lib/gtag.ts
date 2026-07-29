export const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? ''

export function trackEvent(action: string, params?: Record<string, string | number>) {
  if (typeof window === 'undefined' || !GA_ID) return
  // @ts-expect-error gtag is injected by GA script
  window.gtag?.('event', action, params)
}

// Google Ads 轉換追蹤（與 GA4 事件分開、不互相取代）
// send_to = AW-帳戶ID/轉換label（在 Google Ads 建立的「手動事件」轉換動作）
const ADS_ID = 'AW-18344665774'
export const ADS_CONVERSIONS = {
  lineContact: `${ADS_ID}/0DmWCOm9mdYcEK7FtatE`, // 「聯絡人」= 加 LINE 點擊
  leadForm: `${ADS_ID}/lCX4CJS_sNYcEK7FtatE`, // 「提交待開發客戶表單」= 招商表單送出
}

export function trackAdsConversion(sendTo: string) {
  if (typeof window === 'undefined') return
  // @ts-expect-error gtag is injected by GA script
  window.gtag?.('event', 'conversion', { send_to: sendTo })
}

// Predefined events for MooLah flows
export const ga = {
  viewProvider: (providerId: string) =>
    trackEvent('view_provider', { provider_id: providerId }),

  selectService: (serviceId: string, serviceName: string) =>
    trackEvent('select_service', { service_id: serviceId, service_name: serviceName }),

  beginBooking: (providerId: string) =>
    trackEvent('begin_checkout', { provider_id: providerId }),

  completeBooking: (providerId: string, serviceId: string, value: number) =>
    trackEvent('purchase', { provider_id: providerId, service_id: serviceId, value, currency: 'TWD' }),

  viewDiscover: (category?: string) =>
    trackEvent('view_discover', { category: category ?? 'all' }),

  clickLineOA: (source: string) => {
    trackEvent('click_line_oa', { source })
    trackAdsConversion(ADS_CONVERSIONS.lineContact)
  },

  submitLead: (category: string, plan: string) => {
    trackEvent('generate_lead', { category, plan })
    trackAdsConversion(ADS_CONVERSIONS.leadForm)
  },
}
