import { defineConfig } from "@solidjs/start/config";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
const OUTPUT_DIR = "dist";

const isSSRBuild = process.env.SSR === "true"

export default defineConfig({
	vite: {
		plugins: [
			tailwindcss(),

			VitePWA({
				registerType: "prompt",

				// devOptions: {
				// 	enabled: true,
				// },

				scope: "/",

				workbox: {
					globDirectory: OUTPUT_DIR,
					globPatterns: ["**/*.{js,css,html,ico,png,webp,svg,woff2,woff}"],
					globIgnores: ["**/_server/**", "**/_worker.js/__"],
					modifyURLPrefix: {
						"": "../",
					},
					...(isSSRBuild ? {} :{// Serve index.html for navigation requests (SPA) when offline / network fails
					navigateFallback: "/index.html",

					// Denylist: do not treat asset or API requests as navigation fallbacks
					// (prevents binary/file requests or /api calls from returning index.html)
					navigateFallbackDenylist: [
						// asset requests (anything with a file extension)
						new RegExp("\\.[^/]+$"),
						// API calls
						new RegExp("^/api"),
					],}),



					/** Cache the API calls for suggestions*/
					runtimeCaching: [
						{
							urlPattern: ({ request }) => request.mode === "navigate",
							handler: "NetworkFirst",
							options: {
								cacheName: "html-pages",
								// expiration: {
								// 	maxEntries: 50,
								// 	maxAgeSeconds: 24 * 60 * 60  // 1 day
								// },
								cacheableResponse: {
									statuses: [0, 200],
								},
							},
						},
						{
							urlPattern: ({ url: { origin, pathname } }) =>
								(origin === "https://api.datamuse.com" &&
									pathname === "/sug") ||
								(origin === "https://api.urbandictionary.com" &&
									pathname === "/v0/autocomplete-extra"),

							handler: "StaleWhileRevalidate",

							options: {
								cacheName: "datamuse-api-calls",

								expiration: {
									// On average, there will be 3 suggestion api calls per word, and this should cache up to a 100 word suggestions, give or take
									maxEntries: 310,

									maxAgeSeconds: 60 * 60,

									purgeOnQuotaError: true,
								},

								cacheableResponse: {
									statuses: [0, 200],
								},
							},
						},
						{
							handler: "StaleWhileRevalidate",

							urlPattern: ({ request }) => request.destination === "audio",

							options: {
								cacheName: "audio-pronounciations",

								expiration: {
									/** On average, each audio will be ~15KB and I don't wish to go too far beyond ~1MB */
									maxEntries: 70,

									/** One week */
									maxAgeSeconds: 60 * 60 * 24 * 7,

									purgeOnQuotaError: true,
								},

								cacheableResponse: {
									statuses: [0, 200],
								},
							},
						},
						{
							urlPattern: ({ request }) =>
								request.destination === "script" ||
								request.destination === "style" ||
								request.destination === "image" ||
								request.destination === "font",
							handler: "StaleWhileRevalidate",
							options: {
								cacheName: "static-resources",
								expiration: {
									maxEntries: 100,
									// maxAgeSeconds: 7 * 24 * 60 * 60  // 1 week
								},
							},
						},
					],
					cleanupOutdatedCaches: true,
				},

				manifest: {
					name: "Lexicache Dictionary",
					short_name: "Lexicache",
					description: "A simple dictionary PWA.",
					theme_color: "#00000000",
					icons: [
						{
							src: "/pwa-64x64.webp",
							sizes: "64x64",
							type: "image/webp",
						},
						{
							src: "/pwa-192x192.webp",
							sizes: "192x192",
							type: "image/webp",
						},
						{
							src: "/pwa-512x512.webp",
							sizes: "512x512",
							type: "image/webp",
						},
						{
							src: "/maskable-icon-512x512.webp",
							sizes: "512x512",
							type: "image/webp",
							purpose: "maskable",
						},
						{
							src: "/maskable-icon-512x512.webp",
							sizes: "512x512",
							type: "image/webp",
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

		prerender: { crawlLinks: true, routes: ["/", "/settings", "/about"] },

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

		compressPublicAssets: true,

		compatibilityDate: { cloudflare: "latest", default: "latest" },

		routeRules: {
			"**/*.html": {
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

	ssr: isSSRBuild ?true:false,
});
