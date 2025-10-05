import { trackStore } from "@solid-primitives/deep";
import {
	createEffect,
	createSelector,
	For,
	type JSXElement,
	on,
} from "solid-js";
import { createStore, produce, type StoreSetter, unwrap } from "solid-js/store";
import Tooltip from "~/components/tooltip";
import { getNameOfDictionaryApi } from "~/dictionaries/dictionary";
import { DICTIONARY_API } from "~/shared/enums";
import { gDefaultSettings, gSetSettings, gSettings } from "~/shared/store";
import type { GlobalSettings } from "~/types/store";
import { prettifyTime } from "~/utils/humanify";
import * as idb from "~/utils/idb";
import { cloneStore } from "~/utils/store";

const CACHE_LIMITS = {
	DURATION: { min: 1000, max: 1000 * 60 * 60 * 24 * 7 }, // 1 second to 7 days
	SIZE: { min: 10, max: 5000 }, // 10 to 5000 entries
	CLEANUP_INTERVAL: { min: 1000 * 10, max: 1000 * 60 * 60 }, // 10 seconds to 1 hour
	CLEANUP_BATCH: { min: 1, max: 1000 }, // 1 to 1000 entries
} as const;

const TOOLTIP_MESSAGES = {
	URBAN_DICT_WARNING:
		"Enabling this may slow down the search. Also provides suggestions",
	DATAMUSE_INFO: "Also provides suggestions",
	CACHE_DURATION: "How long till a cached word is refreshed",
	CACHE_SIZE:
		"To prevent the cache from bloating up too much, since each entry is ~2.6KB",
	CLEANUP_INTERVAL: "How often should the app try to evict expired caches",
	CLEANUP_BATCH:
		"When evicting expired caches, how many entries should be processed at once",
} as const;

export default function Settings() {
	const [tempSettings, _setTempSettings] = createStore<GlobalSettings>(
		cloneStore(gSettings),
	);

	const setTempSettings = (params: StoreSetter<GlobalSettings, []>) => {
		_setTempSettings(params);
		_setTempSettings({ savedOn: new Date() });
	};

	const isSettingsChanged = () =>
		gSettings.savedOn.getTime() !== tempSettings.savedOn.getTime();

	// Auto-save to IndexedDB when settings change
	createEffect(
		on(
			() => trackStore(gSettings),
			() => {
				idb.set(["settings", unwrap(gSettings)]);
			},
		),
	);

	const handleSubmit = (e: Event) => {
		e.preventDefault();
		gSetSettings(tempSettings);
	};

	const handleReset = () => {
		_setTempSettings(cloneStore(gDefaultSettings));
		gSetSettings(cloneStore(tempSettings));
	};

	return (
		<form
			class="relative flex h-[85%] flex-col flex-wrap gap-2 p-4 pt-0 md:pt-4"
			onSubmit={handleSubmit}
		>
			<UiSettings
				tempSettings={tempSettings}
				setTempSettings={setTempSettings}
			/>

			<DictionarySelector
				tempSettings={tempSettings}
				setTempSettings={setTempSettings}
			/>

			<CacheSettings
				tempSettings={tempSettings}
				setTempSettings={setTempSettings}
			/>

			<ActionButtons onReset={handleReset} isDisabled={!isSettingsChanged()} />
		</form>
	);
}

type SettingsProps = {
	tempSettings: GlobalSettings;
	setTempSettings: (params: StoreSetter<GlobalSettings, []>) => void;
};

function UiSettings(props: SettingsProps) {
	const searchBarPosTag = "search-bar-pos";
	const searchBarPosSelector = createSelector(
		() => props.tempSettings.searchBarPos,
	);

	const handlePositionChange = (position: "top" | "bottom") => {
		props.setTempSettings(
			produce((state) => {
				state.searchBarPos = position;
			}),
		);
	};

	return (
		<SettingsFieldset legend="UI">
			<ul>
				<li class="space-x-2">
					<label for={searchBarPosTag} class="font-semibold">
						Search Bar Position:
					</label>

					<RadioOption
						name={searchBarPosTag}
						label="Top"
						checked={searchBarPosSelector("top")}
						onChange={() => handlePositionChange("top")}
					/>

					<RadioOption
						name={searchBarPosTag}
						label="Bottom"
						checked={searchBarPosSelector("bottom")}
						onChange={() => handlePositionChange("bottom")}
					/>
				</li>
			</ul>
		</SettingsFieldset>
	);
}

function DictionarySelector(props: SettingsProps) {
	const { DATAMUSE, URBAN_DICTIONARY } = DICTIONARY_API;

	const handleDictionaryToggle = (
		dictionary: DICTIONARY_API,
		checked: boolean,
	) => {
		props.setTempSettings(
			produce((state) => {
				if (checked) {
					state.dictionaries.add(dictionary);
				} else {
					state.dictionaries.delete(dictionary);
				}
			}),
		);
	};

	const getDictionaryTooltip = (dictionary: DICTIONARY_API) => {
		switch (dictionary) {
			case URBAN_DICTIONARY:
				return TOOLTIP_MESSAGES.URBAN_DICT_WARNING;
			case DATAMUSE:
				return TOOLTIP_MESSAGES.DATAMUSE_INFO;
			default:
				return null;
		}
	};

	return (
		<SettingsFieldset legend="Dictionaries To Use">
			<div class="grid size-fit grid-cols-2 gap-2">
				<For each={Object.values(DICTIONARY_API)}>
					{(dictionary) => {
						const tooltipMessage = getDictionaryTooltip(dictionary);

						return (
							<label class="label text-base-content">
								<input
									type="checkbox"
									checked={props.tempSettings.dictionaries.has(dictionary)}
									onInput={({ target: { checked } }) =>
										handleDictionaryToggle(dictionary, checked)
									}
									class="checkbox"
								/>

								{tooltipMessage && (
									<Tooltip
										info={<div class="max-w-52">{tooltipMessage}</div>}
										class="size-4"
									/>
								)}

								<a
									href={dictionary}
									target="_blank"
									class="link link-ghost overflow-x-auto"
								>
									{getNameOfDictionaryApi(dictionary)}
								</a>
							</label>
						);
					}}
				</For>
			</div>
		</SettingsFieldset>
	);
}

function CacheSettings(props: SettingsProps) {
	const updateCacheDuration = (value: number) => {
		props.setTempSettings({ cacheDuration: value });
	};

	const updateCacheSize = (value: number) => {
		props.setTempSettings({ cacheSize: value });
	};

	const updateCleanupInterval = (value: number) => {
		props.setTempSettings(
			produce((state) => {
				state.cleanup.interval = value;
			}),
		);
	};

	const updateCleanupBatchSize = (value: number) => {
		props.setTempSettings(
			produce((state) => {
				state.cleanup.batchSize = value;
			}),
		);
	};

	return (
		<SettingsFieldset legend="Cache Settings">
			<RangeInput
				name="Cache Duration"
				min={CACHE_LIMITS.DURATION.min}
				max={CACHE_LIMITS.DURATION.max}
				value={props.tempSettings.cacheDuration}
				valueString={prettifyTime(props.tempSettings.cacheDuration)}
				tooltip={TOOLTIP_MESSAGES.CACHE_DURATION}
				onInput={updateCacheDuration}
			/>

			<RangeInput
				name="Cache Size"
				min={CACHE_LIMITS.SIZE.min}
				max={CACHE_LIMITS.SIZE.max}
				value={props.tempSettings.cacheSize}
				valueString={`${props.tempSettings.cacheSize} entries`}
				tooltip={TOOLTIP_MESSAGES.CACHE_SIZE}
				onInput={updateCacheSize}
			/>

			<RangeInput
				name="Cleanup Interval"
				min={CACHE_LIMITS.CLEANUP_INTERVAL.min}
				max={CACHE_LIMITS.CLEANUP_INTERVAL.max}
				value={props.tempSettings.cleanup.interval}
				valueString={prettifyTime(props.tempSettings.cleanup.interval)}
				tooltip={TOOLTIP_MESSAGES.CLEANUP_INTERVAL}
				onInput={updateCleanupInterval}
			/>

			<RangeInput
				name="Cleanup Batch Size"
				min={CACHE_LIMITS.CLEANUP_BATCH.min}
				max={CACHE_LIMITS.CLEANUP_BATCH.max}
				value={props.tempSettings.cleanup.batchSize}
				valueString={`${props.tempSettings.cleanup.batchSize} entries`}
				tooltip={TOOLTIP_MESSAGES.CLEANUP_BATCH}
				onInput={updateCleanupBatchSize}
			/>
		</SettingsFieldset>
	);
}

function RangeInput(props: {
	name: string;
	min: number;
	max: number;
	value: number;
	valueString?: string;
	tooltip: string;
	onInput: (value: number) => void;
}) {
	return (
		<div class="flex flex-col gap-2">
			<p class="label space-x-1 text-base-content">
				{props.name}:
				<span class="text-primary">{props.valueString ?? props.value}</span>
				<Tooltip
					info={<div class="max-w-52">{props.tooltip}</div>}
					class="size-4"
				/>
			</p>

			<input
				type="range"
				min={props.min}
				max={props.max}
				value={props.value}
				class="range range-sm mb-2 w-full"
				onInput={({ target: { value } }) => props.onInput(Number(value))}
			/>
		</div>
	);
}

function RadioOption(props: {
	name: string;
	label: string;
	checked: boolean;
	onChange: () => void;
}) {
	return (
		<label class="label text-base-content">
			{props.label}{" "}
			<input
				type="radio"
				name={props.name}
				class="radio"
				checked={props.checked}
				onInput={props.onChange}
			/>
		</label>
	);
}

function ActionButtons(props: { onReset: () => void; isDisabled: boolean }) {
	return (
		<div class="absolute bottom-[4vh] left-[6vw] flex gap-4">
			<button type="button" class="btn btn-secondary" onClick={props.onReset}>
				Reset
			</button>

			<button type="submit" class="btn btn-primary" disabled={props.isDisabled}>
				Save
			</button>
		</div>
	);
}

function SettingsFieldset(props: {
	legend: string;
	class?: string;
	children: JSXElement;
}) {
	return (
		<fieldset
			class={`fieldset h-fit w-82 rounded-box border border-base-300 bg-base-200 p-4 md:w-90 ${props.class ?? ""}`}
		>
			<legend class="fieldset-legend">{props.legend}</legend>
			{props.children}
		</fieldset>
	);
}
