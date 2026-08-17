'use client'

import { useState } from 'react'
import { authHeader } from '@/lib/clientAuth'
import {
  PROVIDER_THEME_OPTIONS,
  type ProviderThemeKey,
} from '@/lib/providerTheme'
import {
  providerThemePreviewHref,
  providerThemeSaveError,
} from '@/lib/providerThemeAdmin'

type ThemePickerPanelProps = {
  providerId: string
  selectedTheme: ProviderThemeKey
  savedTheme: ProviderThemeKey
  onSelect: (theme: ProviderThemeKey) => void
  onSaved: (theme: ProviderThemeKey) => void
}

const THEME_NOTES: Record<ProviderThemeKey, string> = {
  'bali-stone': '天然石材與靜謐暖灰',
  'ubud-slow': '森林綠與手作藤編氣息',
  'quiet-luxury': '低調、克制的度假質感',
  'moolah-gold': '熟悉的品牌金與奶油白',
  'rainforest-jade': '雨後青玉般的清透感',
  'terracotta-sunset': '赤陶、夕陽與溫暖肌理',
  'indigo-tides': '海鹽霧氣與沉靜靛藍',
  'orchid-dusk': '暮色蘭紫與柔霧光澤',
}

export function ThemePickerPanel({
  providerId,
  selectedTheme,
  savedTheme,
  onSelect,
  onSaved,
}: ThemePickerPanelProps) {
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const hasChanges = selectedTheme !== savedTheme

  const saveTheme = async () => {
    if (!hasChanges || saving) return
    setSaving(true)
    setMessage('')
    try {
      const response = await fetch('/api/admin/theme', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ providerId, theme: selectedTheme }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        setMessage(providerThemeSaveError(response.status, payload?.error))
        return
      }
      onSaved(selectedTheme)
      setMessage('已儲存，顧客下次開啟頁面就會看到新風格。')
    } catch {
      setMessage(providerThemeSaveError(0, 'network_error'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section aria-labelledby="theme-picker-title" style={{ padding: '18px 16px 40px' }}>
      <div style={{ marginBottom: '18px' }}>
        <p id="theme-picker-title" style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 'calc(25px * var(--fs, 1))', color: 'var(--charcoal)', lineHeight: 1.15 }}>
          頁面風格
        </p>
        <p style={{ marginTop: '7px', fontSize: 'calc(12px * var(--fs, 1))', color: 'rgba(44,40,37,0.58)', lineHeight: 1.65 }}>
          點選即可在後台即時試色；先預覽首頁與預約頁，確認後再儲存。
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
        {PROVIDER_THEME_OPTIONS.map(option => {
          const selected = option.key === selectedTheme
          const saved = option.key === savedTheme
          return (
            <button
              key={option.key}
              type="button"
              aria-pressed={selected}
              onClick={() => { onSelect(option.key); setMessage('') }}
              style={{
                minHeight: '142px', padding: '12px', textAlign: 'left', cursor: 'pointer',
                borderRadius: '17px', position: 'relative', overflow: 'hidden',
                background: option.swatches[2], color: '#2C2825',
                border: selected ? `2px solid ${option.swatches[0]}` : '1px solid rgba(44,40,37,0.11)',
                boxShadow: selected ? `0 10px 26px ${option.swatches[0]}2e` : '0 5px 16px rgba(44,40,37,0.05)',
                transition: 'transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease',
              }}
            >
              <span aria-hidden="true" style={{ display: 'flex', height: '46px', borderRadius: '11px', overflow: 'hidden', marginBottom: '11px', boxShadow: 'inset 0 0 0 1px rgba(44,40,37,0.07)' }}>
                {option.swatches.map((swatch, index) => (
                  <span key={swatch} style={{ flex: index === 0 ? 1.25 : 1, background: swatch }} />
                ))}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'calc(12px * var(--fs, 1))', fontWeight: 700, lineHeight: 1.3 }}>
                {option.label}
                {saved && <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '99px', background: option.swatches[0], color: option.swatches[2], letterSpacing: '0.06em' }}>使用中</span>}
              </span>
              <span style={{ display: 'block', marginTop: '5px', fontSize: 'calc(10px * var(--fs, 1))', color: 'rgba(44,40,37,0.57)', lineHeight: 1.45 }}>
                {THEME_NOTES[option.key]}
              </span>
            </button>
          )
        })}
      </div>

      <div style={{ marginTop: '16px', padding: '14px', borderRadius: '16px', background: 'rgba(255,255,255,0.58)', border: '1px solid rgba(var(--theme-accent-rgb-legacy),0.2)' }}>
        <p style={{ fontSize: 'calc(11px * var(--fs, 1))', color: 'rgba(44,40,37,0.52)', marginBottom: '10px' }}>以顧客視角檢查目前選擇</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <a href={providerThemePreviewHref(providerId, selectedTheme, 'home')} target="_blank" rel="noreferrer" style={{ minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', border: '1px solid var(--theme-accent)', color: 'var(--theme-accent)', fontSize: 'calc(12px * var(--fs, 1))', fontWeight: 700, textDecoration: 'none' }}>
            預覽專屬首頁
          </a>
          <a href={providerThemePreviewHref(providerId, selectedTheme, 'book')} target="_blank" rel="noreferrer" style={{ minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', border: '1px solid var(--theme-accent)', color: 'var(--theme-accent)', fontSize: 'calc(12px * var(--fs, 1))', fontWeight: 700, textDecoration: 'none' }}>
            預覽預約頁
          </a>
        </div>
        <button
          type="button"
          onClick={saveTheme}
          disabled={!hasChanges || saving}
          style={{ width: '100%', minHeight: '48px', marginTop: '10px', border: 'none', borderRadius: '13px', cursor: hasChanges && !saving ? 'pointer' : 'default', background: hasChanges ? 'var(--theme-accent-strong)' : 'rgba(44,40,37,0.12)', color: hasChanges ? '#fffaf4' : 'rgba(44,40,37,0.42)', fontSize: 'calc(13px * var(--fs, 1))', fontWeight: 750, letterSpacing: '0.04em' }}
        >
          {saving ? '儲存中…' : hasChanges ? '儲存這個風格' : '目前使用此風格'}
        </button>
        {message && (
          <p role="status" style={{ marginTop: '10px', fontSize: 'calc(11px * var(--fs, 1))', color: message.startsWith('已儲存') ? '#477064' : '#9a513d', lineHeight: 1.55 }}>
            {message}
          </p>
        )}
      </div>
    </section>
  )
}
