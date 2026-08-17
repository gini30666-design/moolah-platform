import { NextRequest, NextResponse } from 'next/server'
import { getSheetData } from '@/lib/sheets'
import { providerThemeFromRow } from '@/lib/providerTheme'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const [providerRows, serviceRows, portfolioRows] = await Promise.all([
    getSheetData('providers!A2:AA'),
    getSheetData('services!A2:G'),  // G = imageUrl (#11)
    getSheetData('portfolio!A2:D'),
  ])

  const r = providerRows.find(row => row[0] === id)
  if (!r) return NextResponse.json({ error: 'Provider not found' }, { status: 404 })

  const provider = {
    id: r[0],
    name: r[1],
    category: r[2],
    description: r[3],
    avatarUrl: r[5] ?? '',
    storeName: r[6] ?? '',
    address: r[7] ?? '',
    district: r[8] ?? '',
    businessHours: r[9] ?? '',
    phone: r[10] ?? '',
    instagram: r[11] ?? '',
    shortCode: r[12] ?? '',
    coverUrl:    r[13] ?? '',
    rating:      r[14] ?? '',
    reviewCount: r[15] ?? '',
    years:       r[16] ?? '',
    tagline:     r[17] ?? '',
    specialties: r[18] ?? '',
    role:        r[19] ?? '',
    plan:        (r[21] ?? '').toString().trim(),   // V: trial | active | expired | ''(舊資料視為正式)
    trialEndsAt: r[23] ?? '',                        // X: 試用到期 ISO
    isDemo:      String(r[24] ?? '').toLowerCase() === 'true',  // 示範帳號：可完整體驗流程，但不產生真實預約
    // Z: works（預設，有可挑選的作品）| space（除毛/採耳/按摩等無「作品」可拍的品類，改放環境與設備照）
    // works=作品集（美髮/美甲）｜space=環境設備（除毛/採耳/按摩）｜scene=活動實景（潛水/戶外體驗）
    // 未知值一律退回 works，保持既有職人行為不變
    portfolioMode: (['space', 'scene'].includes(String(r[25] ?? '').trim())
      ? String(r[25]).trim() : 'works') as 'works' | 'space' | 'scene',
    theme: providerThemeFromRow(r),
  }

  const services = serviceRows
    .filter(row => row[0] === id)
    .map(row => ({
      id: row[1],
      name: row[2],
      price: Number(row[3]),
      duration: Number(row[4]),
      description: row[5] ?? '',
      imageUrl: row[6] ?? '',  // #11
    }))

  const portfolio = portfolioRows
    .filter(row => row[0] === id)
    .map(row => ({ id: row[1], imageUrl: row[2], caption: row[3] ?? '' }))

  return NextResponse.json({ provider, services, portfolio })
}
