import { NextRequest, NextResponse } from 'next/server'
import {
  getSheetData, sheets, SHEET_ID,
  findServiceRow, updateServiceAtRow, clearServiceAtRow,
} from '@/lib/sheets'
import { verifyOwner } from '@/lib/auth'

function generateServiceId() {
  return `SVC${Date.now()}`
}

export async function POST(req: NextRequest) {
  const { providerId, name, price, duration, description } = await req.json()
  if (!providerId || !name || price == null || !duration) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const auth = await verifyOwner(req, providerId)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  // 明確計算下一可寫列，再用 values.update 寫死範圍，避免 values.append
  // 在有空白列（刪除服務後留下的）的表上把整列寫偏。
  const colA = await getSheetData('services!A:A')
  const nextRow = colA.length + 1
  const serviceId = generateServiceId()
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `services!A${nextRow}:F${nextRow}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[providerId, serviceId, name, String(price), String(duration), description ?? '']],
    },
  })
  return NextResponse.json({ ok: true, serviceId })
}

export async function PATCH(req: NextRequest) {
  const { providerId, serviceId, name, price, duration, description } = await req.json()
  if (!providerId || !serviceId || !name || price == null || !duration) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const auth = await verifyOwner(req, providerId)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const serviceRows = await getSheetData('services!A2:F')
  const row = serviceRows.find(r => r[1] === serviceId)
  if (!row || row[0] !== providerId) {
    return NextResponse.json({ error: 'Service not found' }, { status: 404 })
  }
  const sheetRow = await findServiceRow(serviceId)
  if (sheetRow === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await updateServiceAtRow(sheetRow, [
    providerId, serviceId, name, String(price), String(duration), description ?? '',
  ])
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const { providerId, serviceId } = await req.json()
  if (!providerId || !serviceId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const auth = await verifyOwner(req, providerId)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const serviceRows = await getSheetData('services!A2:F')
  const row = serviceRows.find(r => r[1] === serviceId)
  if (!row || row[0] !== providerId) {
    return NextResponse.json({ error: 'Service not found' }, { status: 404 })
  }
  const sheetRow = await findServiceRow(serviceId)
  if (sheetRow === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await clearServiceAtRow(sheetRow)
  return NextResponse.json({ ok: true })
}
