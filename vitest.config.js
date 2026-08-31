import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

export default defineConfig({
  esbuild: {
    exclude: [],
    include: /(src|__tests__)\/.*\.jsx?$/,
    loader: 'jsx',
  },
  optimizeDeps: {
    esbuildOptions: {
      plugins: [
        {
          name: 'load-js-files-as-jsx',

          setup(build) {
            build.onLoad({ filter: /(src|__tests__)\/.*\.js$/ }, async (args) => ({
              contents: await fs.readFile(args.path, 'utf8'),
              loader: 'jsx',
            }));
          },
        },
      ],
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@tests': fileURLToPath(new URL('./__tests__', import.meta.url)),
    },
  },
  test: {
    coverage: {
      all: true,
      enabled: true,
    },
    env: {
      // Node's native --experimental-webstorage global shadows happy-dom's
      // window.localStorage, leaving `localStorage` undefined in tests.
      NODE_OPTIONS: '--no-experimental-webstorage',
    },
    environment: 'happy-dom',
    exclude: ['node_modules'],
    globals: true,
    include: ['**/*.test.js', '**/*.test.jsx'],
    sequence: {
      shuffle: true,
    },
    setupFiles: ['./setupTest.js'],
  },
});
