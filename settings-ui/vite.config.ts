import { preset } from '@basmilius/vite-preset';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
    base: './',
    plugins: [
        preset({
            cssModules: {
                classNames: 'mangled'
            },
            fileNames: 'actual',
            isLibrary: false
        }),
        vue(),
        {
            name: 'inject-base-css',
            transformIndexHtml: {
                order: 'post',
                handler(html) {
                    return html.replace(
                        '</head>',
                        `
                          <link rel="stylesheet" href="../assets/app/base.css">
                          <link rel="stylesheet" href="../assets/app/icons.css">
                        </head>
                        `,
                    )
                }
            }
        }
    ],
    build: {
        assetsDir: '',
        cssMinify: 'lightningcss',
        emptyOutDir: true,
        minify: 'oxc',
        outDir: '../settings',
        sourcemap: false,
        target: 'chrome110',
        rolldownOptions: {
            experimental: {
                lazyBarrel: true
            },
            output: {
                assetFileNames: '[name].[ext]',
                chunkFileNames: '[name].[ext]',
                entryFileNames: '[name].js'
            }
        }
    }
});
