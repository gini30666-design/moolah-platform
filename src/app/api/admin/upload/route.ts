import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'

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

    const blob = await put(`portfolio/${Date.now()}-${file.name}`, file, {
      access: 'public',
    })

    return NextResponse.json({ url: blob.url })
  } catch (err: unknown) {
    const e = err as Error
    console.error('Upload error full:', e.message, e.stack)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
