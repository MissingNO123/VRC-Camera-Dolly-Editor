import react from '@vitejs/plugin-react';
import { UserConfig, ConfigEnv } from 'vite';
import { rmSync } from 'node:fs';
import { join } from 'path';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import pkg from './package.json';
import { input } from '@material-tailwind/react';

const root = join(__dirname);
const srcRoot = join(__dirname, 'src');
rmSync('dist-electron', { recursive: true, force: true });

const buildElectron = (isDev: boolean) => ({
  sourcemap: isDev,
  minify: !isDev,
  outDir: join(root, 'dist-electron'),
  rollupOptions: {
    external: Object.keys(pkg.dependencies || {})
  }
});

function plugins(isDev: boolean) {
  return [
    react(),
    electron([
      {
        // Main-Process entry file of the Electron App.
        entry: join(root, 'electron/index.ts'),
        onstart(options) {
          options.startup();
        },
        vite: {
          build: buildElectron(isDev)
        }
      },
      {
        entry: join(root, 'electron/preload.ts'),
        onstart(options) {
          // Notify the Renderer-Process to reload the page when the Preload-Scripts build is complete,
          // instead of restarting the entire Electron App.
          options.reload();
        },
        vite: {
          build: buildElectron(isDev)
        }
      },
      {
        entry: join(root, 'electron/preload_viewport.ts'),
        onstart(options) {
          // Notify the Renderer-Process to reload the page when the Preload-Scripts build is complete,
          // instead of restarting the entire Electron App.
          options.reload();
        },
        vite: {
          build: buildElectron(isDev)
        }
      }
    ]),

    renderer()
  ];
}

export default ({ command }: ConfigEnv): UserConfig => {
  // DEV
  if (command === 'serve') {
    return {
      root: srcRoot,
      publicDir: join(srcRoot, 'public'),
      base: '/',
      plugins: plugins(true),
      resolve: {
        alias: {
          '/@': srcRoot
        }
      },
      build: {
        outDir: join(root, '/dist-vite'),
        emptyOutDir: true,
        rollupOptions: {
          input: {
            main: join(srcRoot, 'index.html'),
            viewport: join(srcRoot, 'viewport.html')
          }
        }
      },
      server: {
        port: process.env.PORT === undefined ? 3000 : +process.env.PORT
      },
      optimizeDeps: {
        exclude: ['path']
      }
    };
  }
  // PROD
  return {
    root: srcRoot,
    publicDir: join(srcRoot, 'public'),
    base: './',
    plugins: plugins(false),
    resolve: {
      alias: {
        '/@': srcRoot
      }
    },
    build: {
      outDir: join(root, '/dist-vite'),
      emptyOutDir: true,
      rollupOptions: {
        input: {
          main: join(srcRoot, 'index.html'),
          viewport: join(srcRoot, 'viewport.html')
        }
      }
    },
    server: {
      port: process.env.PORT === undefined ? 3000 : +process.env.PORT
    },
    optimizeDeps: {
      exclude: ['path']
    }
  };
};
