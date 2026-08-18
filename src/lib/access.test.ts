import { describe, expect, it } from 'vitest'
import { roleSatisfies, normalizeMemberRole, type AccessRole } from './access'

describe('roleSatisfies', () => {
  it('三種角色都能做日常接單（staff 級）', () => {
    for (const role of ['owner', 'manager', 'staff'] as AccessRole[]) {
      expect(roleSatisfies(role, 'staff')).toBe(true)
    }
  })

  it('owner 級操作只有 owner 與 manager 過得了', () => {
    expect(roleSatisfies('owner', 'owner')).toBe(true)
    expect(roleSatisfies('manager', 'owner')).toBe(true)
  })

  it('🔴 staff 不能碰 owner 級操作（改價格／排班／儲值）', () => {
    expect(roleSatisfies('staff', 'owner')).toBe(false)
  })
})

describe('normalizeMemberRole', () => {
  it('認得的角色原樣回傳', () => {
    expect(normalizeMemberRole('manager')).toBe('manager')
    expect(normalizeMemberRole('staff')).toBe('staff')
    expect(normalizeMemberRole(' manager ')).toBe('manager')
  })

  it('🔴 不認得的值一律降到 staff，不能因為髒資料就放行', () => {
    for (const bad of ['owner', 'admin', 'OWNER', '', null, undefined, 7, {}]) {
      expect(normalizeMemberRole(bad)).toBe('staff')
    }
  })

  it('🔴 就算 DB 被塞了 role=owner 也只當 staff —— owner 只能來自 providers.line_user_id', () => {
    expect(roleSatisfies(normalizeMemberRole('owner'), 'owner')).toBe(false)
  })
})
