import { trackStore } from "@solid-primitives/deep";
import { createEffect, For, on } from "solid-js";
import { createStore, produce, type StoreSetter, unwrap } from "solid-js/store";
import { DICTIONARY_API } from "~/shared/enums";
import { gDefaultSettings, gSetSettings, gSettings } from "~/shared/store";
import type { GlobalSettings } from "~/types/store";
import * as idb from "~/utils/idb";
import { cloneStore } from "~/utils/store";

export default function Settings() {
	const [tempSettings, _setTempSettings] = createStore<GlobalSettings>(
		cloneStore(gSettings),
	);

	const setTempSettings = (params: StoreSetter<GlobalSettings, []>) => {
		_setTempSettings(params);

		_setTempSettings({ savedOn: new Date() });
	};

	/** save to indexedDB whenever changes are made */
	createEffect(
		on(
			() => trackStore(gSettings),
			() => {
				idb.set(["settings", unwrap(gSettings)]);
			},
		),
	);

	let $form!: HTMLFormElement;

	function SelectedDictionaryApis() {
		return (
			<fieldset class="fieldset bg-base-100 border-base-300 rounded-box w-fit border p-4">
				<legend class="fieldset-legend">Dictionaries To Use</legend>

				<div class="grid gap-2 col-gap-4 grid-cols-1 md:grid-cols-2 size-fit">
					<For each={Object.entries(DICTIONARY_API)}>
						{([key, val]) => (
							<label class="label text-base-content">
								<input
									type="checkbox"
									checked={tempSettings.dictionaries.has(val)}
									onInput={({ target: { checked } }) => {
										setTempSettings(
											produce((state) => {
												const oldSet = state.dictionaries;

												if (checked) oldSet.add(val);
												else oldSet.delete(val);

												state.dictionaries = oldSet;
											}),
										);
									}}
									class="checkbox"
								/>
								{key}{" "}
								<a href={val} class="link link-ghost">
									({val})
								</a>
							</label>
						)}
					</For>
				</div>
			</fieldset>
		);
	}

	return (
		<form
			class="p-4 h-[85%] relative"
			onSubmit={(e) => {
				e.preventDefault();

				gSetSettings(tempSettings);
			}}
			ref={$form}
		>
			<SelectedDictionaryApis />

			<div class="flex gap-4 absolute bottom-[4vh] right-[6vw]">
				<button
					type="button"
					class="btn btn-secondary"
					onClick={(_) => {
						_setTempSettings(gDefaultSettings);

						gSetSettings(tempSettings);

						$form.reset();
					}}
				>
					Reset
				</button>

				<button
					type="submit"
					class="btn btn-primary"
					disabled={
						gSettings.savedOn.getTime() === tempSettings.savedOn.getTime()
					}
				>
					Save
				</button>
			</div>
		</form>
	);
}
