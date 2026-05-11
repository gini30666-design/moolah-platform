import { NextRequest, NextResponse } from 'next/server'
import {
  getSheetData, appendRow,
  findServiceRow, updateServiceAtRow, clearServiceAtRow,
} from '@/lib/sheets'

function generateServiceId() {
  return `SVC${Date.now()}`
}

export async function POST(req: NextRequest) {
  const { providerId, name, price, duration, description } = await req.json()
  if (!providerId || !name || price == null || !duration) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  const serviceId = generateServiceId()
  await appendRow('services!A:F', [
    providerId, serviceId, name, String(price), String(duration), description ?? '',
  ])
  return NextResponse.json({ ok: true, serviceId })
}

export async function PATCH(req: NextRequest) {
  const { providerId, serviceId, name, price, duration, description } = await req.json()
  if (!providerId || !serviceId || !name || price == null || !duration) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
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
