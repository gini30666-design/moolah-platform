import { NextResponse } from 'next/server'
import { sheets, SHEET_ID } from '@/lib/sheets'

export async function POST(req: Request) {
  try {
    const { name, category, district, contact, currentMethod } = await req.json()
    if (!name?.trim() || !category || !district || !contact?.trim()) {
      return NextResponse.json({ error: 'missing fields' }, { status: 400 })
    }

    const id = `lead-${Date.now()}`
    const createdAt = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'leads!A:H',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[id, name.trim(), category, district, contact.trim(), currentMethod || '', createdAt, 'new']],
      },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[leads]', e)
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
