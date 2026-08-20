import { describe, expect, it } from 'vitest'
import { TRIAL_DAYS, trialWindowFrom, trialHasStarted } from './plan'

describe('試用期起算（2026-08-20 起：第一筆預約才起算）', () => {
  it('trialWindowFrom 回傳 14 天的區間', () => {
    const w = trialWindowFrom('2026-08-20T00:00:00.000Z')
    expect(w.startAt).toBe('2026-08-20T00:00:00.000Z')
    expect(w.endsAt).toBe('2026-09-03T00:00:00.000Z')
    expect((new Date(w.endsAt).getTime() - new Date(w.startAt).getTime()) / 86400000).toBe(TRIAL_DAYS)
  })

  it('🔴 plan=trial 但沒有起算日 ＝ 尚未開始（不會過期）', () => {
    expect(trialHasStarted('trial', null)).toBe(false)
    expect(trialHasStarted('trial', '')).toBe(false)
    expect(trialHasStarted('trial', '   ')).toBe(false)
  })

  it('有起算日才算開始', () => {
    expect(trialHasStarted('trial', '2026-08-20T00:00:00.000Z')).toBe(true)
  })

  it('非 trial 方案一律不算試用中', () => {
    expect(trialHasStarted('active', '2026-08-20T00:00:00.000Z')).toBe(false)
    expect(trialHasStarted('', '2026-08-20T00:00:00.000Z')).toBe(false)
    expect(trialHasStarted(null, null)).toBe(false)
  })
})
