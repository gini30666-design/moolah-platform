import { NextRequest, NextResponse } from 'next/server'
import { getSheetData, appendRow, sheets, SHEET_ID } from '@/lib/sheets'

function generatePortfolioId() {
  return `PFO${Date.now()}`
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const providerId = searchParams.get('providerId')
  if (!providerId) return NextResponse.json({ error: 'Missing providerId' }, { status: 400 })

  const rows = await getSheetData('portfolio!A2:F')
  const items = rows
    .filter(r => r[0] === providerId && r[1])
    .map(r => ({
      id: r[1],
      imageUrl: r[2] ?? '',
      caption: r[3] ?? '',
      order: Number(r[4] ?? 0),
    }))
    .sort((a, b) => a.order - b.order)

  return NextResponse.json({ items })
}

export async function POST(req: NextRequest) {
  const { providerId, imageUrl, caption } = await req.json()
  if (!providerId || !imageUrl) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const rows = await getSheetData('portfolio!A2:F')
  const existingCount = rows.filter(r => r[0] === providerId && r[1]).length

  const imageId = generatePortfolioId()
  await appendRow('portfolio!A:F', [
    providerId, imageId, imageUrl, caption ?? '', String(existingCount), new Date().toISOString(),
  ])

  return NextResponse.json({ ok: true, imageId })
}

export async function DELETE(req: NextRequest) {
  const { providerId, imageId } = await req.json()
  if (!providerId || !imageId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const rows = await getSheetData('portfolio!A2:B')
  const idx = rows.findIndex(r => r[0] === providerId && r[1] === imageId)
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const sheetRow = idx + 2
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `portfolio!A${sheetRow}:F${sheetRow}`,
    valueInputOption: 'RAW',
    requestBody: { values: [['', '', '', '', '', '']] },
  })

  return NextResponse.json({ ok: true })
}
