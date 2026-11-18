import type { Source } from './model'

export const official = (label: string, id: string): Source => ({ label, url: 'https://zenless.hoyoverse.com/en-us/news/' + id, kind: 'official' })
export const wiki = (label: string, page: string): Source => ({
  label, url: 'https://zenless-zone-zero.fandom.com/wiki/' + page.replaceAll(' ', '_').split('/').map(encodeURIComponent).join('/'), kind: 'database',
})
export const community = (label: string, url: string): Source => ({ label, url, kind: 'community' })
export const archive = (id: number): Source => ({ label: 'Video Archive data', url: 'https://ghost.mwb.moe/en/zenless/chapter/' + id, kind: 'database' })
export const versionWiki = (version: string) => ({ ...wiki('Version ' + version + ' archive', 'Version'), url: 'https://zenless-zone-zero.fandom.com/wiki/Version/' + version })

export const updates: Record<string, Source> = {
  '1.1': { label: 'HoYoverse 1.1 notices', url: 'https://t.me/s/zzz_official?after=349', kind: 'official' },
  '1.4': official('HoYoverse 1.4 update', '127445'),
  '1.5': official('HoYoverse 1.5 update', '129572'),
  '1.6': official('HoYoverse Season 1 epilogue notice', '154623'),
  '1.7': official('HoYoverse 1.7 update', '155604'),
  '2.4': versionWiki('2.4'),
  '2.5': official('HoYoverse 2.5 update', '161728'),
  '2.6': official('HoYoverse 2.6 update', '162561'),
  '2.8': official('HoYoverse 2.8 update', '163836'),
  '3.0': official('HoYoverse 3.0 update', '164775'),
  '3.1': official('HoYoverse 3.1 update', '165414'),
  '3.2': official('HoYoverse 3.2 update', '166000'),
  '3.3': official('HoYoverse 3.3 update', '166963'),
}
