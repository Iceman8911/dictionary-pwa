import { A } from "@solidjs/router";
import SettingsIcon from "lucide-solid/icons/settings";
import InfoIcon from "lucide-solid/icons/info";

export default function Header() {
	return (
		<h1 class="h-20 mb-4 text-3xl font-bold flex justify-center items-center gap-2">
			<img class="h-10 w-auto" src="/pwa-64x64.png" alt="Dictionary Logo" />

			<A href="/" class="hover:link mr-8" end>
				Lexi Cache
			</A>

			<A href="/settings" end>
				<div class="tooltip tooltip-bottom" data-tip="Settings">
					<button class="btn btn-circle p-1.5">
						<SettingsIcon class="h-8 w-auto" />
					</button>
				</div>
			</A>

			<A href="/about" end>
				<div class="tooltip tooltip-bottom" data-tip="About">
					<button class="btn btn-circle p-1.5">
						<InfoIcon class="h-8 w-auto" />
					</button>
				</div>
			</A>
		</h1>
	);
}
