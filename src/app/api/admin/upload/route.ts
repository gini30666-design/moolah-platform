import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { verifyAccess } from '@/lib/auth'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const providerId = formData.get('providerId') as string | null
    // 'staff'：這支只是把圖存進 Blob 並回一個網址，真正「掛到哪裡」由各自的路由再驗一次
    //（作品集＝owner、客戶作品歷史＝staff）。客服要能替客人存服務紀錄照，所以這裡開到 staff。
    const auth = await verifyAccess(req, providerId, 'staff')
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

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
    console.error('Upload error:', e.message)
    return NextResponse.json({ error: '上傳失敗，請稍後再試' }, { status: 500 })
  }
}
