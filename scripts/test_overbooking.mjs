// 驗證 over-booking 唯一約束：同職人+同日+同時段、未取消者只能一筆
import { createClient } from '@supabase/supabase-js'
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const base = { provider_id: 'designer-003', service_id: 'designer-003-svc01', customer_name: '約束測試', date: '2099-12-31', time: '09:00', status: 'confirmed' }

// 清掉殘留
await sb.from('bookings').delete().like('booking_id', 'TESTOB%')

// 第一筆：應成功
const r1 = await sb.from('bookings').insert({ ...base, booking_id: 'TESTOB1' })
console.log('第 1 筆 (應成功):', r1.error ? '✗ ' + r1.error.message : '✓ 成功')

// 第二筆：同時段未取消 → 應被約束擋下
const r2 = await sb.from('bookings').insert({ ...base, booking_id: 'TESTOB2', customer_name: '搶位者' })
console.log('第 2 筆 同時段 (應被擋):', r2.error ? '✓ 被擋下 → ' + r2.error.message.slice(0, 60) : '✗ 竟然成功了（約束失效！）')

// 第三筆：同時段但 cancelled → 應允許（不算佔位）
const r3 = await sb.from('bookings').insert({ ...base, booking_id: 'TESTOB3', status: 'cancelled' })
console.log('第 3 筆 同時段但已取消 (應允許):', r3.error ? '✗ ' + r3.error.message : '✓ 允許')

// 清理
await sb.from('bookings').delete().like('booking_id', 'TESTOB%')
console.log('已清理測試資料')
