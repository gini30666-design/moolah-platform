import { NextRequest, NextResponse } from 'next/server'
import { getSheetData } from '@/lib/sheets'
import { computeAvailability } from '@/lib/slots'

// 時段計算邏輯抽到 src/lib/slots.ts（與 booking 下單守門共用同一套，杜絕 drift）
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const providerId = searchParams.get('providerId')
  const date = searchParams.get('date')
  const serviceId = searchParams.get('serviceId')

  if (!providerId || !date) {
    return NextResponse.json({ error: 'Missing providerId or date' }, { status: 400 })
  }

  const [bookingRows, serviceRows, availRows] = await Promise.all([
    getSheetData('bookings!A2:M', { provider_id: providerId }),
    getSheetData('services!A2:F', { provider_id: providerId }),
    getSheetData('availability!A2:F', { provider_id: providerId }),
  ])

  const slots = computeAvailability({ providerId, date, serviceId, bookingRows, serviceRows, availRows })
  return NextResponse.json({ slots })
}
