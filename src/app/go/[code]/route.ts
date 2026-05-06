import { NextRequest, NextResponse } from 'next/server'
import { getSheetData } from '@/lib/sheets'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const rows = await getSheetData('providers!A2:M')

  // 第 13 欄（index 12）是 shortCode
  const match = rows.find(r => r[12]?.toLowerCase() === code.toLowerCase())

  if (!match) {
    return NextResponse.redirect(new URL('/', _req.url))
  }

  const providerId = match[0]
  return NextResponse.redirect(new URL(`/${providerId}`, _req.url))
}
