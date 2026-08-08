import { describe, it, expect, vi, afterEach } from 'vitest'
import { copyText } from './clipboard'

// LINE / Instagram 的 webview 常常沒有 navigator.clipboard。
// 這組測試鎖住「三層退路」的行為，避免有人簡化回單一 API。

afterEach(() => vi.unstubAllGlobals())

function stubDom(execResult: boolean | Error) {
  const removed: unknown[] = []
  vi.stubGlobal('document', {
    createElement: () => ({
      value: '', style: {} as Record<string, string>,
      setAttribute() {}, select() {}, setSelectionRange() {},
    }),
    body: { appendChild() {}, removeChild(n: unknown) { removed.push(n) } },
    execCommand: () => { if (execResult instanceof Error) throw execResult; return execResult },
  })
  return removed
}

describe('copyText — 三層退路', () => {
  it('現代 API 可用時直接用它', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    expect(await copyText('hello')).toBe(true)
    expect(writeText).toHaveBeenCalledWith('hello')
  })

  it('★ webview 沒有 navigator.clipboard → 退到 execCommand，仍然成功', async () => {
    vi.stubGlobal('navigator', {})           // 模擬 LINE webview
    stubDom(true)
    expect(await copyText('hello')).toBe(true)
  })

  it('★ 現代 API 存在但被拒絕（無安全環境／無手勢）→ 也要退到 execCommand', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } })
    stubDom(true)
    expect(await copyText('hello')).toBe(true)
  })

  it('兩層都失敗 → 回 false（呼叫端才能提示「請長按複製」，不會謊報已複製）', async () => {
    vi.stubGlobal('navigator', {})
    stubDom(false)
    expect(await copyText('hello')).toBe(false)
  })

  it('execCommand 直接丟錯也不能讓整個頁面爆掉', async () => {
    vi.stubGlobal('navigator', {})
    stubDom(new Error('boom'))
    expect(await copyText('hello')).toBe(false)
  })

  it('用完要把暫時的 textarea 移除，不留垃圾在 DOM', async () => {
    vi.stubGlobal('navigator', {})
    const removed = stubDom(true)
    await copyText('hello')
    expect(removed).toHaveLength(1)
  })
})
