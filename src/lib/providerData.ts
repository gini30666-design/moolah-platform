import { sb } from './supabase'

// 伺服器端取公開職人資料（給 SSR 職人頁的 metadata + JSON-LD 用）
export type PublicProvider = {
  id: string; name: string; category: string | null; description: string | null
  avatar_url: string | null; cover_url: string | null; store_name: string | null
  address: string | null; district: string | null; phone: string | null
  instagram: string | null; rating: string | null; review_count: number | null
  years: number | null; tagline: string | null; specialties: string | null; role: string | null
}

export async function getProviderPublic(id: string) {
  const [pRes, svcRes, pfRes] = await Promise.all([
    sb.from('providers').select('id,name,category,description,avatar_url,cover_url,store_name,address,district,phone,instagram,rating,review_count,years,tagline,specialties,role').eq('id', id).maybeSingle(),
    sb.from('services').select('service_id,name,price,duration,description').eq('provider_id', id),
    sb.from('portfolio').select('portfolio_id,image_url,caption,sort_order').eq('provider_id', id).order('sort_order', { ascending: true }),
  ])
  const provider = pRes.data as PublicProvider | null
  if (!provider) return null
  return {
    provider,
    services: (svcRes.data ?? []).map(s => ({ id: s.service_id, name: s.name, price: Number(s.price), duration: Number(s.duration), description: s.description ?? '' })),
    portfolio: (pfRes.data ?? []).map(p => ({ id: p.portfolio_id, imageUrl: p.image_url ?? '', caption: p.caption ?? '' })),
  }
}
