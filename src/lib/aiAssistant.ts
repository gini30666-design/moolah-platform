export type ProviderData = {
  today: string
  upcoming: Array<{ date: string; time: string; customerName: string; customerPhone: string; serviceName: string }>
  weekStats: { range: string; confirmed: number; completed: number; cancelled: number; noShow: number; revenue: number }
  monthStats: { ym: string; confirmed: number; completed: number; cancelled: number; noShow: number; revenue: number }
  services: Array<{ name: string; price: number; duration: number }>
  recentCustomers: Array<{ name: string; visits: number }>
}

export function buildDataBundleText(d: ProviderData): string {
  const upcoming = d.upcoming.length
    ? d.upcoming.map(b => `  ${b.date} ${b.time}｜${b.customerName}｜${b.serviceName}${b.customerPhone ? `｜${b.customerPhone}` : ''}`).join('\n')
    : '無'
  const services = d.services.length
    ? d.services.map(s => `  ${s.name}：NT$${s.price.toLocaleString()}／${s.duration}分`).join('\n')
    : '無'
  const customers = d.recentCustomers.length
    ? d.recentCustomers.map(c => `  ${c.name}（累計 ${c.visits} 次）`).join('\n')
    : '無'
  const wk = d.weekStats
  const mo = d.monthStats
  return [
    `今天：${d.today}`,
    '',
    `未來預約：${d.upcoming.length ? '' : '無'}`,
    ...(d.upcoming.length ? [upcoming] : []),
    '',
    `本週（${wk.range}）：成交 ${wk.completed + wk.confirmed} 筆（完成 ${wk.completed}／待服務 ${wk.confirmed}／取消 ${wk.cancelled}／no-show ${wk.noShow}）；營收 NT$${wk.revenue.toLocaleString()}`,
    `本月（${mo.ym}）：成交 ${mo.completed + mo.confirmed} 筆（完成 ${mo.completed}／待服務 ${mo.confirmed}／取消 ${mo.cancelled}／no-show ${mo.noShow}）；營收 NT$${mo.revenue.toLocaleString()}`,
    '',
    `服務項目：`,
    services,
    '',
    `近期客人：`,
    customers,
  ].join('\n')
}
