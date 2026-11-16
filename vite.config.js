import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  optimizeDeps: {
    // Icons are imported one file at a time (phosphor-svelte/lib/<Name>). Pre-bundled,
    // each one would get its own copy of Svelte's runtime and crash in dev.
    // arcade-hub-ui ships Svelte source, compiled here like the site's own files.
    exclude: ['phosphor-svelte', 'arcade-hub-ui'],
  },
  test: {
    // Compile the package's .svelte.js files (runes) for the tests too.
    server: { deps: { inline: ['arcade-hub-ui'] } },
  },
})
