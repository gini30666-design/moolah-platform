export const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? ''

export function trackEvent(action: string, params?: Record<string, string | number>) {
  if (typeof window === 'undefined' || !GA_ID) return
  // @ts-expect-error gtag is injected by GA script
  window.gtag?.('event', action, params)
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

  clickLineOA: (source: string) =>
    trackEvent('click_line_oa', { source }),
}
