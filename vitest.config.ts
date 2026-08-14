import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Les tests sont exclus de tsconfig.app.json (tsc de prod). Sans ça,
  // esbuild retombe sur le JSX classique et plante : React is not defined.
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    environment: 'node',
    environmentMatchGlobs: [['**/*.test.tsx', 'jsdom']],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    setupFiles: ['src/test/setup.ts'],
    coverage: {
      reporter: ['text'],
    },
  },
})
