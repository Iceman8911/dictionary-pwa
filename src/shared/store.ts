import { createStore } from "solid-js/store";
import type { GlobalSettings } from "~/types/store";
import { cloneStore } from "~/utils/store";
import { DICTIONARY_API as DictionaryApis } from "./enums";

const { DATAMUSE, DICTIONARY_API, FREE_DICTIONARY } = DictionaryApis;

const gDefaultSettings = {
	dictionaries: new Set([DATAMUSE]),
	savedOn: new Date(0),
} as const satisfies GlobalSettings;

const [gSettings, gSetSettings] = createStore<GlobalSettings>(
	cloneStore(gDefaultSettings),
);

export { gSetSettings, gSettings, gDefaultSettings };
