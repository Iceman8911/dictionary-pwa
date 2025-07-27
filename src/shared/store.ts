import { createStore } from "solid-js/store";
import type { GlobalSettings } from "~/types/store";
import { cloneStore } from "~/utils/store";
import { DICTIONARY_API as DictionaryApis } from "./enums";

const { DATAMUSE } = DictionaryApis;

const gDefaultSettings = {
	/** 1 hour */
	cacheDuration: 1000 * 60 * 60,

	/** 1000 cached entries */
	cacheSize: 1000,

	cleanup: {
		batchSize: 25,

		/** 30 seconds */
		interval: 1000 * 30,
	},

	dictionaries: new Set([DATAMUSE]),

	savedOn: new Date(0),
} as const satisfies GlobalSettings;

const [gSettings, gSetSettings] = createStore<GlobalSettings>(
	cloneStore(gDefaultSettings),
);

export { gSetSettings, gSettings, gDefaultSettings };
