import { A } from "@solidjs/router";
import DictionaryIcon from "lucide-solid/icons/book-marked";
import SettingsIcon from "lucide-solid/icons/settings";

export default function Header() {
	return (
		<h1 class="h-20 mb-4 text-3xl font-bold flex justify-center items-center gap-2">
			<DictionaryIcon class="h-10 w-auto" />

			<A href="/" end>
				Lexi Cache
			</A>

			<A href="/settings" end>
				<SettingsIcon class="h-8 w-auto ml-8" />
			</A>
		</h1>
	);
}
