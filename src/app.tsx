import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Show, Suspense } from "solid-js";
import "./app.css";
import { pwaInfo } from "virtual:pwa-info";
import { Link, MetaProvider } from "@solidjs/meta";
import Header from "./components/header";
import ReloadPrompt from "./components/reload-prompt";
import { onMount } from "solid-js";
import { gSetSettings } from "./shared/store";
import * as idb from "~/utils/idb";

export default function App() {
	// Load up stored data
	onMount(async () => {
		const savedSettings = await idb.get("settings");

		if (savedSettings) gSetSettings(savedSettings);
	});

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
