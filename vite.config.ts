import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  const target = process.env.BUILD_TARGET || 'web';
  const isWeb = target === 'web';

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      outDir: isWeb ? 'dist-web' : 'dist-extension',
      rollupOptions: {
        input: isWeb 
          ? {
              main: path.resolve(__dirname, 'packages/web/index.html'),
            }
          : {
              popup: path.resolve(__dirname, 'packages/extension/popup.html'),
              sidepanel: path.resolve(__dirname, 'packages/extension/sidepanel.html'),
              newtab: path.resolve(__dirname, 'packages/extension/newtab.html'),
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
