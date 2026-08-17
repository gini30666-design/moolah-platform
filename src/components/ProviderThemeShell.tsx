import type { CSSProperties, ReactNode } from 'react'
import { resolveProviderTheme } from '@/lib/providerTheme'

type ProviderThemeShellProps = {
  children: ReactNode
  theme?: unknown
  previewTheme?: unknown
  className?: string
  style?: CSSProperties
}

export function ProviderThemeShell({
  children,
  theme,
  previewTheme,
  className,
  style,
}: ProviderThemeShellProps) {
  const resolvedTheme = resolveProviderTheme(theme, previewTheme)
  const shellClassName = ['provider-theme-shell', className].filter(Boolean).join(' ')

  return (
    <div className={shellClassName} data-theme={resolvedTheme} style={style}>
      {children}
    </div>
  )
}
