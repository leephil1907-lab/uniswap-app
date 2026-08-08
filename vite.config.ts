import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: [
        { find: /^@\/src\/(.*)/, replacement: path.resolve(__dirname, './src/$1') },
        { find: /^@\/(.*)/, replacement: path.resolve(__dirname, './src/$1') },
        { find: '@', replacement: path.resolve(__dirname, './src') },
      ],
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            wagmi: ['wagmi', 'viem', '@reown/appkit', '@reown/appkit-adapter-wagmi'],
            motion: ['framer-motion', 'motion'],
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
