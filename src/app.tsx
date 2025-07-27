import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { createEffect, on, Show, Suspense, untrack } from "solid-js";
import "./app.css";
import { pwaInfo } from "virtual:pwa-info";
import { Link, MetaProvider } from "@solidjs/meta";
import { onMount } from "solid-js";
import * as idb from "~/utils/idb";
import Header from "./components/header";
import ReloadPrompt from "./components/reload-prompt";
import { cleanupExpiredCachedEntriesWhenAboveSizeLimit } from "./dictionaries/dictionary";
import { gSetSettings, gSettings } from "./shared/store";

export default function App() {
	let cleanupInterval: number | null = null;

	const setCleanupInterval = () =>
		untrack(() =>
			setInterval(
				() => {
					cleanupExpiredCachedEntriesWhenAboveSizeLimit();
				},
				gSettings.cleanup.interval,
				"",
			),
		);

	// Load up stored data and start up the interval-based cache cleanup
	onMount(async () => {
		const savedSettings = await idb.get("settings");

		if (savedSettings) gSetSettings(savedSettings);
	});

	// Everytime the cleanup interval is changed, reset the interval so we don't have multiple stuff running in the background
	createEffect(
		on(
			() => gSettings.cleanup.interval,
			() => {
				if (cleanupInterval != null) clearInterval(cleanupInterval);

				cleanupInterval = setCleanupInterval();
			},
		),
	);

	const webManifest = () => pwaInfo?.webManifest ?? null;

	return (
		<MetaProvider>
			{/* check for and add a Link for the web manifest */}
			<Show when={webManifest()}>
				{(data) => (
					<Link
						rel="manifest"
						href={data().href}
						crossOrigin={data().useCredentials ? "use-credentials" : undefined}
					/>
				)}
			</Show>

			<Link rel="icon" href="/favicon.ico" sizes="48x48" />

			<Link rel="icon" href="/logo.svg" sizes="any" type="image/svg+xml" />

			<Link rel="apple-touch-icon" href="/apple-touch-icon-180x180.png" />

			<Router
				root={(props) => (
					<>
						<main class="h-[100vh] w-[100vw]">
							<Header />

							<ReloadPrompt />

							<Suspense>{props.children}</Suspense>
						</main>
					</>
				)}
			>
				<FileRoutes />
			</Router>
		</MetaProvider>
	);
}
