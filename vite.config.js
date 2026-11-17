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
    // Its dependencies still go through the pre-bundle: socket.io-client pulls
    // CommonJS modules (debug) that the browser cannot load as they are.
    include: ['arcade-hub-ui > socket.io-client'],
  },
  test: {
    // Compile the package's .svelte.js files (runes) for the tests too.
    server: { deps: { inline: ['arcade-hub-ui'] } },
    setupFiles: ['./src/test-setup.js'],
  },
})
