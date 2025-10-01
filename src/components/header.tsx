import { A } from "@solidjs/router";
import InfoIcon from "lucide-solid/icons/info";
import SettingsIcon from "lucide-solid/icons/settings";

export default function Header() {
	return (
		<h1 class="mb-4 flex h-20 items-center justify-center gap-2 font-bold text-3xl">
			<img class="h-10 w-auto" src="/pwa-64x64.webp" alt="Dictionary Logo" />

			<A href="/" class="link mr-8" end>
				Lexi Cache
			</A>

			<A href="/settings" end>
				<div class="tooltip tooltip-bottom" data-tip="Settings">
					<button type="button" class="btn btn-circle p-1.5">
						<SettingsIcon class="h-8 w-auto" />
					</button>
				</div>
			</A>

			<A href="/about" end>
				<div class="tooltip tooltip-bottom" data-tip="About">
					<button type="button" class="btn btn-circle p-1.5">
						<InfoIcon class="h-8 w-auto" />
					</button>
				</div>
			</A>
		</h1>
	);
}
