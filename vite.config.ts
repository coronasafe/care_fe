import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vite";
import { promises as fs } from "fs";
import react from "@vitejs/plugin-react-swc";

const cdnUrls =
  process.env.CARE_CDN_URL ??
  [
    "https://egov-s3-facility-10bedicu.s3.amazonaws.com",
    "https://egov-s3-patient-data-10bedicu.s3.amazonaws.com",
    "http://localhost:4566",
  ].join(" ");

export default defineConfig({
  envPrefix: "REACT_",
  plugins: [
    react(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "service-worker.ts",
      // injectRegister: null,
      devOptions: {
        enabled: true,
        type: "module",
      },
      injectManifest: {
        maximumFileSizeToCacheInBytes: 7000000,
      },
      manifest: {
        name: "Care",
        short_name: "Care",
        theme_color: "#0e9f6e",
        background_color: "#ffffff",
        display: "standalone",
        icons: [
          {
            src: "images/icons/pwa-64x64.png",
            sizes: "64x64",
            type: "image/png",
          },
          {
            src: "images/icons/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "images/icons/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "images/icons/maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
  build: {
    outDir: "build",
    assetsDir: "bundle",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
      },
    },
    commonjsOptions: {
      // workaround for react-phone-input-2 https://github.com/vitejs/vite/issues/2139#issuecomment-1405624744
      defaultIsModuleExports(id) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const module = require(id);
          if (module?.default) {
            return false;
          }
          return "auto";
        } catch (error) {
          return "auto";
        }
      },
      transformMixedEsModules: true,
    },
  },
  server: {
    port: 4000,
    proxy: {
      "/api": {
        target: process.env.CARE_API ?? "http://192.168.0.204:9000/",
        changeOrigin: true,
      },
    },
  },
  preview: {
    headers: {
      "Content-Security-Policy-Report-Only": `default-src 'self';\
      script-src 'self' blob: 'nonce-f51b9742' https://plausible.10bedicu.in;\
      style-src 'self' 'unsafe-inline';\
      connect-src 'self' https://plausible.10bedicu.in;\
      img-src 'self' https://cdn.coronasafe.network ${cdnUrls};\
      object-src 'self' ${cdnUrls};`,
    },
    port: 4000,
    proxy: {
      "/api": {
        target: process.env.CARE_API ?? "http://192.168.0.204:9000/",
        changeOrigin: true,
      },
    },
  },
  esbuild: {
    loader: "tsx",
    include: [/src\/.*\.[tj]sx?$/],
    exclude: [/src\/stories/],
  },

  define: {
    // for unconventional usage of global by third party libraries
    global: "window",
  },
  optimizeDeps: {
    esbuildOptions: {
      plugins: [
        // again thanks to thirdparty libraries for using jsx in js files
        {
          name: "load-js-files-as-jsx",
          setup(build) {
            build.onLoad({ filter: /src\/.*\.js$/ }, async (args) => ({
              loader: "jsx",
              contents: await fs.readFile(args.path, "utf8"),
            }));
          },
        },
      ],
    },
  },
});
