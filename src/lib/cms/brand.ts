export function applyBrandCss(hex: string) {
  const brand = hex.toUpperCase()
  return {
    '--brand': brand,
    '--ring': brand,
    '--primary': brand,
    '--brand-hover': mixHex(brand, '#000000', 0.15),
    '--brand-wash': mixHex(brand, '#ffffff', 0.88),
    '--brand-ink': mixHex(brand, '#000000', 0.35),
    '--brand-foreground': pickForeground(brand),
  } as Record<string, string>
}

/** Public marketing shell: brand CTAs only; zinc primary chrome stays from tokens. */
export function applyMarketingBrandCss(hex: string) {
  const brand = hex.toUpperCase()
  return {
    '--brand': brand,
    '--brand-hover': mixHex(brand, '#000000', 0.15),
    '--brand-wash': mixHex(brand, '#ffffff', 0.88),
    '--brand-ink': mixHex(brand, '#000000', 0.35),
    '--brand-foreground': pickForeground(brand),
  } as Record<string, string>
}

function pickForeground(hex: string) {
  const { r, g, b } = parseHex(hex)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.62 ? '#0A0A0A' : '#FFFFFF'
}

function parseHex(hex: string) {
  const value = hex.replace('#', '')
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  }
}

function mixHex(hex: string, other: string, amount: number) {
  const a = parseHex(hex)
  const b = parseHex(other)
  const mix = (x: number, y: number) =>
    Math.round(x * (1 - amount) + y * amount)
  const r = mix(a.r, b.r)
  const g = mix(a.g, b.g)
  const bl = mix(a.b, b.b)
  return `#${[r, g, bl].map((n) => n.toString(16).padStart(2, '0')).join('')}`
}
