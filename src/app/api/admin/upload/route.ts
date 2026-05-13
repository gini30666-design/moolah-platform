import { NextRequest, NextResponse } from 'next/server'
import { uploadImageToDrive } from '@/lib/drive'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    if (file.size > 4 * 1024 * 1024) {
      return NextResponse.json({ error: '圖片大小不可超過 4MB' }, { status: 400 })
    }
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: '僅支援圖片格式' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const url = await uploadImageToDrive(buffer, file.name, file.type)
    return NextResponse.json({ url })
  } catch (err: unknown) {
    const e = err as Error & { code?: number; status?: number; errors?: unknown[] }
    console.error('Upload error:', e.message, 'code:', e.code, 'status:', e.status, 'errors:', JSON.stringify(e.errors))
    return NextResponse.json({ error: e.message ?? '上傳失敗，請稍後再試' }, { status: 500 })
  }
}
