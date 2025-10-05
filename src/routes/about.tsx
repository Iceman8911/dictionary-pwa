const APP_INFO = {
	name: "Offline Dictionary PWA",
	version: "0.1.0",
	description:
		"A fast, offline-capable dictionary application built with SolidJS and SolidStart.",
	features: [
		"Search multiple dictionary APIs simultaneously",
		"Offline-first design with intelligent caching",
		"Clean, responsive user interface",
		"Customizable search suggestions",
		"Multiple dictionary sources including Datamuse and Urban Dictionary",
		"Audio pronunciations when available",
		"Word definitions, examples, and related terms",
		"Configurable cache settings",
	],
	technologies: [
		"SolidJS",
		"TypeScript",
		"Vite",
		"IndexedDB",
		"Service Workers",
		"Progressive Web App (PWA)",
	],
} as const;

export default function AboutPage() {
	return (
		<div class="flex h-[85%] flex-col gap-6 overflow-y-auto p-6">
			<header class="text-center">
				<h1 class="font-bold text-3xl text-primary">{APP_INFO.name}</h1>
				<p class="text-base-content/80 text-lg">Version {APP_INFO.version}</p>
			</header>

			<section class="rounded-box bg-base-200 p-4">
				<h2 class="mb-3 font-semibold text-xl">About</h2>
				<p class="text-base-content">{APP_INFO.description}</p>
			</section>

			<section class="rounded-box bg-base-200 p-4">
				<h2 class="mb-3 font-semibold text-xl">Features</h2>
				<ul class="list-disc space-y-1 pl-5">
					{APP_INFO.features.map((feature) => (
						<li class="text-base-content">{feature}</li>
					))}
				</ul>
			</section>

			<section class="rounded-box bg-base-200 p-4">
				<h2 class="mb-3 font-semibold text-xl">Built With</h2>
				<div class="flex flex-wrap gap-2">
					{APP_INFO.technologies.map((tech) => (
						<span class="badge badge-primary">{tech}</span>
					))}
				</div>
			</section>

			<footer class="text-center text-base-content/60 text-sm">
				<p>Built with ❤️ for fast, offline dictionary lookups</p>
			</footer>
		</div>
	);
}
