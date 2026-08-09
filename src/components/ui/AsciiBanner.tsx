const GLYPHS: Record<string, string[]> = {
  F: ['11111', '10000', '11110', '10000', '10000'],
  R: ['11110', '10001', '11110', '10010', '10001'],
  E: ['11111', '10000', '11110', '10000', '11111'],
  C: ['01111', '10000', '10000', '10000', '01111'],
  L: ['10000', '10000', '10000', '10000', '11111'],
  O: ['01110', '10001', '10001', '10001', '01110'],
  U: ['10001', '10001', '10001', '10001', '01110'],
  D: ['11110', '10001', '10001', '10001', '11110'],
  I: ['111', '010', '010', '010', '111'],
  N: ['10001', '11001', '10101', '10011', '10001'],
  T: ['11111', '00100', '00100', '00100', '00100'],
  A: ['01110', '10001', '11111', '10001', '10001'],
  V: ['10001', '10001', '10001', '01010', '00100'],
  ' ': ['000', '000', '000', '000', '000'],
}

const GLYPH_ROWS = 5

function renderLine(text: string): string[] {
  const rows = Array.from({ length: GLYPH_ROWS }, () => '')
  for (const char of text.toUpperCase()) {
    const glyph = GLYPHS[char] ?? GLYPHS[' ']
    for (let row = 0; row < GLYPH_ROWS; row++) {
      rows[row] += `${glyph[row].replaceAll('1', '█').replaceAll('0', ' ')} `
    }
  }
  return rows
}

interface AsciiBannerProps {
  lines: string[]
  className?: string
}

export function AsciiBanner({ lines, className = '' }: AsciiBannerProps) {
  const text = lines.map((line) => renderLine(line).join('\n')).join('\n\n')

  return <pre className={`select-none font-mono leading-none text-tui-fg ${className}`}>{text}</pre>
}
