import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { Marked } from 'marked'
import type { Plugin } from 'vite'
import { policies, policyPaths, siteDescription, siteOrigin, siteTitle } from '../src/policies/routes.ts'
import type { PolicyPath } from '../src/policies/routes.ts'

const moduleName = 'virtual:policy-content'
const moduleId = '\0' + moduleName

function escapeHtml(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
}

const markdownParser = new Marked({ renderer: { html: ({ text }) => escapeHtml(text) } })

function policyFilename(path: PolicyPath) {
  return fileURLToPath(new URL('../' + policies[path].file, import.meta.url))
}

function readPolicy(path: PolicyPath) {
  const filename = policyFilename(path)
  const markdown = readFileSync(filename, 'utf8').replaceAll('\r\n', '\n')
  const heading = '# ' + policies[path].title + '\n'
  if (!markdown.startsWith(heading)) throw new Error(filename + ' must start with ' + heading.trimEnd())
  return markdownParser.parse(markdown.slice(heading.length), { async: false })
}

function pageHtml(template: string, title: string, description: string, path: string, content: string) {
  const canonical = siteOrigin + path
  return template.replace('<!-- page-metadata -->', () => [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<link rel="canonical" href="${canonical}" />`,
    '<meta property="og:type" content="website" />',
    '<meta property="og:site_name" content="Zenlessentials" />',
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:image" content="${siteOrigin}/icons/app-512.png" />`,
    '<meta property="og:image:alt" content="Zenlessentials app icon" />',
  ].join('\n    ')).replace('<!-- page-content -->', () => content)
}

export function policyPages(): Plugin {
  const links = policyPaths.map((path) => `<a href="${path}">${policies[path].title}</a>`).join(' ')
  const home = `<main class="static-intro panel"><h1>Zenlessentials</h1><p>${siteDescription}</p><nav class="policy-links" aria-label="Project policies">${links}</nav></main>`

  return {
    name: 'zenlessentials-policy-pages',
    resolveId(id) {
      if (id === moduleName) return moduleId
    },
    load(id) {
      if (id !== moduleId) return
      for (const path of policyPaths) this.addWatchFile(policyFilename(path))
      return 'export default ' + JSON.stringify(Object.fromEntries(policyPaths.map((path) => [path, readPolicy(path)])))
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html, { server }) {
        if (server) return pageHtml(html, siteTitle, siteDescription, '/', home)
      },
    },
    generateBundle: {
      order: 'post',
      handler(_, bundle) {
        const index = bundle['index.html']
        if (index?.type !== 'asset' || typeof index.source !== 'string') this.error('Could not find the built app shell.')
        const template = index.source
        index.source = pageHtml(template, siteTitle, siteDescription, '/', home)
        for (const path of policyPaths) {
          const { title, description } = policies[path]
          const body = readPolicy(path)
          // Keep the public policy contacts usable without Cloudflare's email decoder.
          const content = `<main class="static-intro"><article class="policy-document panel"><h1>${title}</h1><div class="policy-copy"><!--email_off-->${body}<!--/email_off--></div></article><nav class="policy-links" aria-label="Project policies"><a href="/">Zenlessentials home</a> ${links}</nav></main>`
          this.emitFile({ type: 'asset', fileName: path.slice(1) + '.html', source: pageHtml(template, title + ' — Zenlessentials', description, path, content) })
        }
      },
    },
  }
}
