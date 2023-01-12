import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                popup: resolve(__dirname, 'src/popup/popup.ts'),
                content: resolve(__dirname, 'src/content/content.ts')
            },
            output: {
                dynamicImportInCjs: true,
                entryFileNames: '[name].js',
                chunkFileNames: '[name].js',
                assetFileNames: '[name].[ext]'
            },
            external: ['chrome-types']
        }
    },
});
