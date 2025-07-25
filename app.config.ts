import { defineConfig } from "@solidjs/start/config";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
	vite: {
		plugins: [
			tailwindcss(),

			VitePWA({
				registerType: "prompt",

				devOptions: {
					enabled: true,
				},

				scope: "/",

				// pwaAssets: { image: "/logo.png" },

				workbox: {
					globPatterns: ["**/*"],

					// Explicitly add the root path to ensure index.html is precached. The revision value here will be changed by a script later.
					additionalManifestEntries: [
						{ url: "index.html", revision: "REV_INDEX_HTML_TO_CHANGE" },
					],

					/** Cache the API calls */
					runtimeCaching: [
						{
							urlPattern: ({ url }) =>
								url.origin === "https://api.datamuse.com",
							handler: "StaleWhileRevalidate",
							options: {
								cacheName: "datamuse-api-calls",
								expiration: {
									maxEntries: 150,
									maxAgeSeconds: 60 * 60,
								},
								cacheableResponse: {
									statuses: [0, 200],
								},
							},
						},
					],

					// navigateFallbackDenylist: [/^\/api/],
				},

				manifest: {
					name: "Lexicache Dictionary",
					short_name: "Lexicache",
					description: "A simple dictionary PWA.",
					// theme_color: "#ffffff",
					icons: [
						{
							src: "/pwa-64x64.png",
							sizes: "64x64",
							type: "image/png",
						},
						{
							src: "/pwa-192x192.png",
							sizes: "192x192",
							type: "image/png",
						},
						{
							src: "/pwa-512x512.png",
							sizes: "512x512",
							type: "image/png",
						},
						{
							src: "/maskable-icon-512x512.png",
							sizes: "512x512",
							type: "image/png",
							purpose: "maskable",
						},
						{
							src: "/maskable-icon-512x512.png",
							sizes: "512x512",
							type: "image/png",
							purpose: "any",
						},
					],
					display: "standalone",
				},
			}),
		],
	},

	server: {
		preset: "cloudflare-pages",

		prerender: { crawlLinks: true },

		cloudflare: {
			wrangler: {
				compatibility_date: "2025-05-23",
				name: "lexicache",
				vars: {
					NODE_VERSION: 22,
				},
			},
			deployConfig: true,
		},

		compressPublicAssets: { gzip: true, brotli: true },

		compatibilityDate: { cloudflare: "latest", default: "latest" },

		routeRules: {
			"index.html": {
				headers: {
					"cache-control": "public, max-age=0, must-revalidate",
				},
			},
			"_build/sw.js": {
				headers: {
					"cache-control": "public, max-age=0, must-revalidate",
					"service-worker-allowed": "/",
				},
			},
		},
	},

	ssr: false,
});
