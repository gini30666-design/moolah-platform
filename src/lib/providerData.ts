import { sb } from './supabase'
import {
  isMissingProviderThemeColumn,
  normalizeProviderTheme,
  type ProviderThemeKey,
} from './providerTheme'

// 伺服器端取公開職人資料（給 SSR 職人頁的 metadata + JSON-LD 用）
export type PublicProvider = {
  id: string; name: string; category: string | null; description: string | null
  avatar_url: string | null; cover_url: string | null; store_name: string | null
  address: string | null; district: string | null; phone: string | null
  instagram: string | null; rating: string | null; review_count: number | null
  years: number | null; tagline: string | null; specialties: string | null; role: string | null
  theme: ProviderThemeKey
}

type PublicProviderRow = Omit<PublicProvider, 'theme'> & { theme?: string | null }

const PUBLIC_PROVIDER_COLUMNS = 'id,name,category,description,avatar_url,cover_url,store_name,address,district,phone,instagram,rating,review_count,years,tagline,specialties,role,theme'
const LEGACY_PUBLIC_PROVIDER_COLUMNS = 'id,name,category,description,avatar_url,cover_url,store_name,address,district,phone,instagram,rating,review_count,years,tagline,specialties,role'

async function getPublicProviderRow(id: string) {
  let result = await sb.from('providers').select(PUBLIC_PROVIDER_COLUMNS).eq('id', id).maybeSingle()
  if (isMissingProviderThemeColumn(result.error)) {
    result = await sb.from('providers').select(LEGACY_PUBLIC_PROVIDER_COLUMNS).eq('id', id).maybeSingle()
  }
  return result
}

export async function getProviderPublic(id: string) {
  const [pRes, svcRes, pfRes] = await Promise.all([
    getPublicProviderRow(id),
    sb.from('services').select('service_id,name,price,duration,description').eq('provider_id', id),
    sb.from('portfolio').select('portfolio_id,image_url,caption,sort_order').eq('provider_id', id).order('sort_order', { ascending: true }),
  ])
  const providerRow = pRes.data as PublicProviderRow | null
  if (!providerRow) return null
  const provider: PublicProvider = {
    ...providerRow,
    theme: normalizeProviderTheme(providerRow.theme),
  }
  return {
    provider,
    services: (svcRes.data ?? []).map(s => ({ id: s.service_id, name: s.name, price: Number(s.price), duration: Number(s.duration), description: s.description ?? '' })),
    portfolio: (pfRes.data ?? []).map(p => ({ id: p.portfolio_id, imageUrl: p.image_url ?? '', caption: p.caption ?? '' })),
  }
}
