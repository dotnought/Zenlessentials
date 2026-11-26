/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module 'virtual:policy-content' {
  const content: Record<import('./policies/routes').PolicyPath, string>
  export default content
}
