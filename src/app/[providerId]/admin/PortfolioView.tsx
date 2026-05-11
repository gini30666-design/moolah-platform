'use client'
import { useState, useEffect, useRef } from 'react'

type PortfolioItem = { id: string; imageUrl: string; caption: string; order: number }

const oak = '#A68966'
const charcoal = '#2C2825'
const cream = '#fbf9f4'
const inputStyle: React.CSSProperties = {
  width: '100%', background: 'rgba(166,137,102,0.06)',
  border: '1px solid rgba(166,137,102,0.18)', borderRadius: '10px',
  padding: '10px 13px', fontSize: '13px', color: charcoal, outline: 'none',
  boxSizing: 'border-box',
}

export default function PortfolioView({ providerId }: { providerId: string }) {
  const [items, setItems] = useState<PortfolioItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [addMode, setAddMode] = useState<'upload' | 'url'>('upload')
  const [urlInput, setUrlInput] = useState('')
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function fetchItems() {
    const res = await fetch(`/api/admin/portfolio?providerId=${providerId}`)
    const data = await res.json()
    setItems(data.items ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchItems() }, [providerId])

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 4 * 1024 * 1024) { alert('圖片大小不可超過 4MB'); return }

    setUploading(true)
    setUploadProgress('上傳中...')

    const formData = new FormData()
    formData.append('file', file)
    const uploadRes = await fetch('/api/admin/upload', { method: 'POST', body: formData })
    const uploadData = await uploadRes.json()

    if (!uploadRes.ok) {
      alert(uploadData.error ?? '上傳失敗')
      setUploading(false)
      setUploadProgress('')
      return
    }

    setUploadProgress('儲存中...')
    await fetch('/api/admin/portfolio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providerId, imageUrl: uploadData.url, caption }),
    })

    setUploading(false)
    setUploadProgress('')
    setCaption('')
    setShowAdd(false)
    if (fileRef.current) fileRef.current.value = ''
    fetchItems()
  }

  async function handleUrlAdd() {
    if (!urlInput.trim()) return
    setUploading(true)

    // Convert Google Drive share link to direct view URL if needed
    let imageUrl = urlInput.trim()
    const gdMatch = imageUrl.match(/\/d\/([a-zA-Z0-9_-]+)/)
    if (gdMatch) {
      imageUrl = `https://drive.google.com/uc?export=view&id=${gdMatch[1]}`
    }

    await fetch('/api/admin/portfolio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providerId, imageUrl, caption }),
    })

    setUploading(false)
    setUrlInput('')
    setCaption('')
    setShowAdd(false)
    fetchItems()
  }

  async function handleDelete(item: PortfolioItem) {
    if (!confirm(`確定刪除這張作品集圖片？`)) return
    setDeletingId(item.id)
    await fetch('/api/admin/portfolio', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providerId, imageId: item.id }),
    })
    setDeletingId(null)
    fetchItems()
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '48px 0' }}>
      <p style={{ fontSize: '12px', color: '#b0a89e' }}>載入作品集中...</p>
    </div>
  )

  return (
    <div style={{ padding: '16px 16px 48px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <p style={{ fontSize: '10px', color: oak, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          作品集 ({items.length})
        </p>
        {!showAdd && (
          <button onClick={() => setShowAdd(true)} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            fontSize: '12px', color: oak, background: 'rgba(166,137,102,0.1)',
            border: 'none', borderRadius: '20px', padding: '7px 14px', cursor: 'pointer',
          }}>
            <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: '14px', height: '14px' }}>
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            新增作品
          </button>
        )}
      </div>

      {/* Add form */}
      {showAdd && (
        <div style={{ background: 'rgba(251,249,244,0.9)', border: '1px solid rgba(166,137,102,0.2)', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: charcoal }}>新增作品</p>
            <button onClick={() => { setShowAdd(false); setCaption(''); setUrlInput('') }} style={{ fontSize: '18px', color: '#b0a89e', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
          </div>

          {/* Mode toggle */}
          <div style={{ display: 'flex', background: 'rgba(166,137,102,0.08)', borderRadius: '10px', padding: '3px', marginBottom: '16px' }}>
            {(['upload', 'url'] as const).map(m => (
              <button key={m} onClick={() => setAddMode(m)} style={{
                flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px',
                background: addMode === m ? charcoal : 'transparent',
                color: addMode === m ? cream : '#8a7e76',
              }}>
                {m === 'upload' ? '上傳圖片' : '貼上網址'}
              </button>
            ))}
          </div>

          {addMode === 'upload' ? (
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                style={{ display: 'none' }}
                id="portfolio-upload"
              />
              <label htmlFor="portfolio-upload" style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '8px', border: '2px dashed rgba(166,137,102,0.3)', borderRadius: '12px',
                padding: '28px 16px', cursor: uploading ? 'default' : 'pointer',
                background: 'rgba(166,137,102,0.03)', marginBottom: '12px',
              }}>
                {uploading ? (
                  <p style={{ fontSize: '13px', color: oak }}>{uploadProgress}</p>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke={oak} strokeWidth="1.5" style={{ width: '32px', height: '32px' }}>
                      <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p style={{ fontSize: '13px', color: '#8a7e76' }}>點擊選擇圖片（最大 4MB）</p>
                  </>
                )}
              </label>
            </div>
          ) : (
            <div style={{ marginBottom: '12px' }}>
              <input
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                placeholder="貼上 Google Drive 或圖片網址"
                style={{ ...inputStyle, marginBottom: '10px' }}
              />
              <button
                onClick={handleUrlAdd}
                disabled={!urlInput.trim() || uploading}
                style={{
                  width: '100%', padding: '12px', borderRadius: '50px', border: 'none',
                  background: !urlInput.trim() || uploading ? 'rgba(166,137,102,0.3)' : oak,
                  color: cream, fontSize: '13px', cursor: 'pointer',
                }}
              >
                {uploading ? '儲存中...' : '確認新增'}
              </button>
            </div>
          )}

          <div>
            <input
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="說明文字（選填）"
              style={inputStyle}
            />
          </div>
        </div>
      )}

      {/* Portfolio grid */}
      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '16px', color: '#c8c0b8' }}>尚未有作品集</p>
          <p style={{ fontSize: '12px', color: '#d0c8c0', marginTop: '8px' }}>點選「新增作品」上傳作品照片</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {items.map(item => (
            <div key={item.id} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', aspectRatio: '1' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.imageUrl}
                alt={item.caption || '作品集圖片'}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              {item.caption && (
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(44,40,37,0.65)', padding: '6px 8px' }}>
                  <p style={{ fontSize: '10px', color: cream, margin: 0 }}>{item.caption}</p>
                </div>
              )}
              <button
                onClick={() => handleDelete(item)}
                disabled={deletingId === item.id}
                style={{
                  position: 'absolute', top: '6px', right: '6px',
                  width: '26px', height: '26px', borderRadius: '50%',
                  background: 'rgba(176,64,64,0.85)', border: 'none',
                  color: '#fff', fontSize: '14px', lineHeight: '26px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {deletingId === item.id ? '...' : '×'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
