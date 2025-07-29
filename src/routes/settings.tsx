import { trackStore } from "@solid-primitives/deep";
import InfoIcon from "lucide-solid/icons/info";
import { createEffect, For, Match, on, Show, Switch } from "solid-js";
import { createStore, produce, type StoreSetter, unwrap } from "solid-js/store";
import { getNameOfDictionaryApi } from "~/dictionaries/dictionary";
import { DICTIONARY_API } from "~/shared/enums";
import { gDefaultSettings, gSetSettings, gSettings } from "~/shared/store";
import type { GlobalSettings } from "~/types/store";
import { prettifyTime } from "~/utils/humanify";
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

	function SelectedDictionaryApis() {
		const { DATAMUSE, URBAN_DICTIONARY } = DICTIONARY_API;

		return (
			<fieldset class="fieldset bg-base-200 border-base-300 rounded-box size-fit border p-4">
				<legend class="fieldset-legend">Dictionaries To Use</legend>

				<div class="grid gap-2 col-gap-4 grid-cols-1 md:grid-cols-2 size-fit">
					<For each={Object.values(DICTIONARY_API)}>
						{(val) => (
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
								<Switch>
									<Match when={val === URBAN_DICTIONARY}>
										<span
											class="tooltip tooltip-right lg:tooltip-top"
											data-tip="Enabling this may slow down the search"
										>
											<InfoIcon class="size-4" />
										</span>
									</Match>

									<Match when={val === DATAMUSE}>
										<span
											class="tooltip tooltip-right lg:tooltip-top"
											data-tip="Also provides suggestions"
										>
											<InfoIcon class="size-4" />
										</span>
									</Match>
								</Switch>
								{getNameOfDictionaryApi(val)}{" "}
								<a
									href={val}
									target="_blank"
									class="link link-ghost overflow-hidden text-ellipsis"
								>
									({val})
								</a>
							</label>
						)}
					</For>
				</div>
			</fieldset>
		);
	}

	function CacheSettingRanges() {
		function _InputAndRange(prop: {
			name: string;
			min: number;
			max: number;
			tooltip: string;
			value: number;
			valueString?: string;
			onInput: (inputVal: number) => void;
		}) {
			return (
				<>
					<p class="label text-base-content">
						{prop.name}:{" "}
						<span class="text-primary">{prop.valueString ?? prop.value}</span>{" "}
						<span class="tooltip" data-tip={prop.tooltip}>
							<InfoIcon class="size-4" />
						</span>
					</p>

					<input
						type="range"
						min={prop.min}
						max={prop.max}
						value={prop.value}
						class="range range-sm w-3xs md:w-xs mb-2"
						onInput={({ target: { value } }) => prop.onInput(Number(value))}
					/>
				</>
			);
		}

		return (
			<fieldset class="fieldset bg-base-200 border-base-300 rounded-box size-fit border p-4">
				<legend class="fieldset-legend">Cache Settings</legend>

				<_InputAndRange
					max={1000 * 60 * 60 * 24 * 7}
					min={1000}
					name="Cache Duration"
					onInput={(val) => setTempSettings({ cacheDuration: val })}
					tooltip="How long till a cached word is refreshed"
					value={tempSettings.cacheDuration}
					valueString={prettifyTime(tempSettings.cacheDuration)}
				/>

				<_InputAndRange
					max={5000}
					min={10}
					name="Cache Size"
					onInput={(val) => setTempSettings({ cacheSize: val })}
					tooltip="To prevent the cache from bloating up too much, since each entry is ~2.6KB"
					value={tempSettings.cacheSize}
					valueString={`${tempSettings.cacheSize} entries`}
				/>

				<_InputAndRange
					max={1000 * 60 * 60}
					min={1000 * 10}
					name="Cleanup Interval"
					onInput={(val) =>
						setTempSettings(
							produce((state) => {
								state.cleanup.interval = val;
							}),
						)
					}
					tooltip="How often should the app try to evict expired caches"
					value={tempSettings.cleanup.interval}
					valueString={prettifyTime(tempSettings.cleanup.interval)}
				/>

				<_InputAndRange
					max={1000}
					min={1}
					name="Cleanup Batch Size"
					onInput={(val) =>
						setTempSettings(
							produce((state) => {
								state.cleanup.batchSize = val;
							}),
						)
					}
					tooltip="When evicting expired caches, how many entries should be processed at once"
					value={tempSettings.cleanup.batchSize}
					valueString={`${tempSettings.cleanup.batchSize} entries`}
				/>
			</fieldset>
		);
	}

	function SaveAndResetButtons() {
		return (
			<div class="flex gap-4 absolute bottom-[4vh] left-[6vw]">
				<button
					type="button"
					class="btn btn-secondary"
					onClick={(_) => {
						_setTempSettings(cloneStore(gDefaultSettings));

						gSetSettings(cloneStore(tempSettings));
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
		);
	}

	return (
		<form
			class="p-4 pt-0 md:pt-4 h-[85%] relative flex flex-col flex-wrap gap-4"
			onSubmit={(e) => {
				e.preventDefault();

				gSetSettings(tempSettings);
			}}
		>
			<SelectedDictionaryApis />

			<CacheSettingRanges />

			<SaveAndResetButtons />
		</form>
	);
}
