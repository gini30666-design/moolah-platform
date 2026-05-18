import React from 'react'

type Tag = 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div'

interface TextRevealProps {
  children: string
  className?: string
  style?: React.CSSProperties
  as?: Tag
  stagger?: number // ms per token
  delay?: number   // base delay ms
}

// Split CJK text into characters, Latin text into words
function tokenize(text: string): string[] {
  const tokens: string[] = []
  let buf = ''
  for (const ch of text) {
    const isCJK = /[一-鿿　-〿＀-￯，。！？、「」『』【】〔〕〈〉《》…—]/.test(ch)
    if (isCJK) {
      if (buf.trim()) { tokens.push(...buf.trim().split(/\s+/).filter(Boolean)); buf = '' }
      tokens.push(ch)
    } else {
      buf += ch
    }
  }
  if (buf.trim()) tokens.push(...buf.trim().split(/\s+/).filter(Boolean))
  return tokens
}

export function TextReveal({ children, className, style, as: Tag = 'div', stagger = 42, delay = 0 }: TextRevealProps) {
  const tokens = tokenize(children)
  const hasCJK = /[一-鿿]/.test(children)

  return (
    <Tag
      data-word-reveal
      aria-label={children}
      className={className}
      style={style}
    >
      {tokens.map((tok, i) => (
        <React.Fragment key={i}>
          <span className="word-wrap" aria-hidden="true">
            <span
              className="word-inner"
              style={{ transitionDelay: `${delay + i * stagger}ms` }}
            >
              {tok}
            </span>
          </span>
          {/* Space between Latin words only */}
          {!hasCJK && i < tokens.length - 1 && ' '}
        </React.Fragment>
      ))}
    </Tag>
  )
}
