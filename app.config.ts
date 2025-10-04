import { defineConfig } from "@solidjs/start/config";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

/** Set this to whatever the build output folder is */
const OUTPUT_DIR = "dist";

const isSSRBuild = process.env.SSR === "true";

// The build script has to be called twice, since the first time, the `OUTPUT_DIR` folder will not be populated with the necessary files
export default defineConfig({
	vite: {
		plugins: [
			tailwindcss(),

			VitePWA({
				registerType: "prompt",

				// So the service worker can access the root of the build folder instead of `/_build/`. This requires a header to actually have the required effect though
				scope: "/",

				workbox: {
					// Explicitly define the path for workbox to search for cacheable assets so that `public` assets and html files are visible
					globDirectory: OUTPUT_DIR,

					// Regular stuff you want to precache
					globPatterns: ["**/*.{js,css,html,ico,png,webp,svg,woff2,woff}"],

					// Skip server and worker stuff since they're server stuff
					globIgnores: ["**/_server/**", "**/_worker.js/**"],

					// Since the service worker gets tossed into a nested `/_build/`, we have to explicitly prepend all precache urls so the files can actually be found in practice. (because every network request the worker makes will have `/_build/` prepended to them in practice anyway)
					modifyURLPrefix: {
						"": "../",
					},

					// For cases where you want to serve a default page when navigating to an uncached page. Not really useful for SSR
					...(isSSRBuild
						? { navigateFallback: null }
						: { navigateFallback: "../index.html" }),

					// navigateFallbackDenylist: [/^\/api/],

					runtimeCaching: [
						// So ssr'd pages get cached upon navigation
						{
							urlPattern: ({ request }) => request.destination === "document",
							handler: "NetworkFirst",
							options: {
								cacheName: "html-pages",
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
							urlPattern: /\.(?:mp3|wav|ogg)$/i,
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
							urlPattern: /\.(?:webp|png|jpg|jpeg|svg|woff2|woff)$/i,
							handler: "StaleWhileRevalidate",
							options: {
								cacheName: "static-resources",
								expiration: {
									maxEntries: 100,
								},
							},
						},
					],

					// For some reason, `runtimeCaching` is ignored unless these 2 are set
					skipWaiting: true,
					clientsClaim: true,

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

		// prerender: { crawlLinks: true, routes: ["/", "/settings", "/about"] },

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
			// Prevent all route html files from getting stale
			"**/*.html": {
				headers: {
					"cache-control": "public, max-age=0, must-revalidate",
				},
			},

			// Give the service worker the required header so it can increase it's `scope`
			"/_build/sw.js": {
				headers: {
					"cache-control": "public, max-age=0, must-revalidate",
					"service-worker-allowed": "/",
				},
			},
		},
	},

	ssr: isSSRBuild,
});
