import react from '@vitejs/plugin-react';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import pkg from './package.json';

const safeName = (pkg?.name ?? 'MiradorAnnotationEditor')
    .replaceAll(/[^a-zA-Z0-9]/g, '');
const peers = Object.keys(pkg?.peerDependencies ?? {});

export default {
  build: {
    lib: {
      cssFileName: 'index.css',
      entry: './src/index.js',
      fileName: (f) => (f === 'es' ? 'index.js' : 'index.cjs'),
      formats: ['es', 'cjs'],
      name: safeName,
    },
    rollupOptions: {
      external: [
        ...peers,
        /^react(\/.*)?$/, /^react-dom(\/.*)?$/,
        /^@mui\/material(\/.*)?$/, /^@mui\/system(\/.*)?$/,
        /^@emotion\/react(\/.*)?$/, /^@emotion\/styled(\/.*)?$/,
        /^mirador(\/.*)?$/,
          'i18next',
          'react-i18next',
      ],
      output: {
        assetFileNames: 'index.[ext]',
        exports: 'auto',
        globals: { react: 'React', 'react-dom': 'ReactDOM' },
      },
    },
    sourcemap: true,
  },
  esbuild: { include: [/src\/.*\.jsx?$/], loader: 'jsx' },
  optimizeDeps: {
    esbuildOptions: {
      plugins: [{
        name: 'load-js-files-as-jsx',
        setup(build) {
          build.onLoad({ filter: /(src|__tests__)\/.*\.js$/ }, async (args) => ({
            contents: await fs.readFile(args.path, 'utf8'),
            loader: 'jsx',
          }));
        },
      }],
    },
    include: ['@emotion/react'],
  },
  plugins: [react()],
  resolve: {
    alias: { '@tests/': fileURLToPath(new URL('./__tests__', import.meta.url)) },
    dedupe: [
      'react', 'react-dom',
      '@mui/material', '@mui/system',
      '@emotion/react', '@emotion/styled',
    ],
  },
  server: { open: '/demo/src/index.html', port: 4444 },
};
