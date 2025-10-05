import { A } from "@solidjs/router";

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
				<p class="text-base-content/80 text-lg">
					Version {APP_INFO.version}{" "}
					<A
						href="https://github.com/Iceman8911/dictionary-pwa"
						target="_blank"
					>
						<svg
							role="img"
							viewBox="0 0 24 24"
							xmlns="http://www.w3.org/2000/svg"
							class="ml-2 inline-block size-6 fill-base-content"
						>
							<title>GitHub</title>
							<path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
						</svg>
					</A>
				</p>
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
