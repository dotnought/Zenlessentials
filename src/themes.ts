export const themes = [
  { id: 'signal', name: 'Signal Yellow' },
  { id: 'hollow', name: 'Hollow Blue' },
  { id: 'ether', name: 'Ether Violet' },
  { id: 'calydon', name: 'Calydon Orange' },
] as const

export type Theme = (typeof themes)[number]['id']
export const defaultTheme = themes[0].id

export function isTheme(value: unknown): value is Theme {
  return themes.some((theme) => theme.id === value)
}
