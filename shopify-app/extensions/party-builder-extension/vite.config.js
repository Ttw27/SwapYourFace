import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';
  
  return {
    plugins: [react()],
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    build: {
      outDir: path.resolve(__dirname, 'assets'),
      emptyOutDir: false,
      lib: {
        entry: path.resolve(__dirname, 'src/index.jsx'),
        name: 'PartyBuilder',
        fileName: () => 'party-builder.js',
        formats: ['iife'],
      },
      rollupOptions: {
        output: {
          assetFileNames: 'party-builder.[ext]',
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM',
          },
        },
      },
      minify: !isDev,
      sourcemap: isDev,
    },
  };
});
