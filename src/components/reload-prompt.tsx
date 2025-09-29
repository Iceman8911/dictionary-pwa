import { useRegisterSW } from "virtual:pwa-register/solid";
import type { Component } from "solid-js";
import { Show } from "solid-js";

const ReloadPrompt: Component = () => {
	const {
		offlineReady: [offlineReady, setOfflineReady],
		needRefresh: [needRefresh, setNeedRefresh],
		updateServiceWorker,
	} = useRegisterSW({
		onRegistered(r) {
			console.log("SW Registered: ", r);
		},
		onRegisterError(error) {
			console.log("SW registration error", error);
		},
	});

	const close = () => {
		setOfflineReady(false);
		setNeedRefresh(false);
	};

	return (
		<div class="m-0 size-0 p-0">
			<Show when={offlineReady() || needRefresh()}>
				<div class="fixed top-0 right-0 z-10 m-4 rounded-field border border-primary bg-base-300 p-3 text-left shadow">
					<div class="mb-2">
						<Show
							fallback={
								<span>
									New content available, click on reload button to update.
								</span>
							}
							when={offlineReady()}
						>
							<span>App ready to work offline</span>
						</Show>
					</div>

					<Show when={needRefresh()}>
						<button
							type="button"
							class="btn btn-primary btn-soft mr-4"
							onClick={() => updateServiceWorker(true)}
						>
							Reload
						</button>
					</Show>

					<button
						type="button"
						class="btn btn-secondary btn-soft"
						onClick={() => close()}
					>
						Close
					</button>
				</div>
			</Show>
		</div>
	);
};

export default ReloadPrompt;
