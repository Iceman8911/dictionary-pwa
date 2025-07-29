import { DICTIONARY_API as DictionaryApis } from "~/shared/enums";
import { gSettings } from "~/shared/store";
import type {
	DictionaryWordIndexeddbKey,
	DictionaryWordIndexeddbValue,
	DictionaryWordResult,
} from "~/types/dictionary";
import * as idb from "~/utils/idb";
import { gIsUserConnectedToInternet } from "~/utils/internet";
import {
	getSearchSuggestions as getSearchSuggestionsFromDatamuseApi,
	queryWordForDictionaryResult as queryWordForDictionaryResultFromDatamuseApi,
} from "./datamuse-api";
import { queryWordForDictionaryResult as queryWordForDictionaryResultFromFreeDictionaryApi } from "./free-dictionary-api";
import { queryWordForDictionaryResult as queryWordForDictionaryResultFromGoogleDictionaryApi } from "./google-dictionary-api";
import {
	getSearchSuggestions as getSearchSuggestionsFromUrbanDictionaryApi,
	queryWordForDictionaryResult as queryWordForDictionaryResultFromUrbanDictionaryApi,
} from "./urban-dictionary-api";

const { DATAMUSE, GOOGLE_DICTIONARY_API, FREE_DICTIONARY, URBAN_DICTIONARY } =
	DictionaryApis;

/** Attempts to get the dictionary results of a particular word.
 *
 * @param payload `dictionary`: If not explicitly given, tries a dicitionary and repeatedly falls back to unused ones if the previous try returns `null`. If explicitly given, no fallbacks will occur
 */
async function fetchDictionaryResult(payload: {
	word: string;
	maxResults?: number;
	dictionary?: DictionaryApis;
}): Promise<DictionaryWordResult | null> {
	const { word, dictionary, maxResults = 10 } = payload;

	// If a specific dictionary is provided, just use that one.
	if (dictionary) {
		return fetchFromApi(dictionary, word, maxResults);
	}

	const APIS_TO_TRY = Object.values(DictionaryApis);

	for (const api of APIS_TO_TRY) {
		const result = await fetchFromApi(api, word, maxResults);

		if (result) return result;
	}

	// No dictionary api was explicitly given and none of the ones we tried worked
	return null;
}

async function fetchFromApi(
	api: DictionaryApis,
	word: string,
	maxResults: number,
): Promise<DictionaryWordResult | null> {
	word = word.trim();

	const cacheKey: DictionaryWordIndexeddbKey = `${api}-${word}`;

	const cachedData = await idb.get(cacheKey);

	// If the cache is present and has not expired or the user is offline
	if (
		cachedData &&
		(!isCachedEntryExpired(cachedData) || !(await gIsUserConnectedToInternet()))
	) {
		return cachedData.data;
	}

	let fetchedData: DictionaryWordResult | null = null;

	switch (api) {
		case DATAMUSE: {
			fetchedData = await queryWordForDictionaryResultFromDatamuseApi({
				word,
				maxResults,
			});

			break;
		}

		case GOOGLE_DICTIONARY_API: {
			fetchedData =
				await queryWordForDictionaryResultFromGoogleDictionaryApi(word);

			break;
		}

		case FREE_DICTIONARY: {
			fetchedData =
				await queryWordForDictionaryResultFromFreeDictionaryApi(word);

			break;
		}

		case URBAN_DICTIONARY: {
			fetchedData = await queryWordForDictionaryResultFromUrbanDictionaryApi(
				word,
				maxResults,
			);

			break;
		}

		default: {
			return null;
		}
	}

	if (fetchedData) {
		// No need to await this since we can afford to
		idb.set([cacheKey, { cachedOn: new Date(), data: fetchedData }]);
	}

	return fetchedData;
}

function isCachedEntryExpired(
	cachedEntry: DictionaryWordIndexeddbValue,
): boolean {
	return cachedEntry.cachedOn.getTime() + gSettings.cacheDuration < Date.now();
}

function isStringDictionaryKey(str: string): str is DictionaryWordIndexeddbKey {
	return Object.values(DictionaryApis).includes(
		(str.split("-")[0] ?? "") as never,
	);
}

function getCacheKeyFromDictionaryResult(
	data: DictionaryWordResult,
): DictionaryWordIndexeddbKey {
	return `${data.originApi}-${data.name}`;
}

async function cleanupExpiredCachedEntriesWhenAboveSizeLimit() {
	const cacheKeys: ReadonlyArray<DictionaryWordIndexeddbKey> = (
		await idb.keys()
	).filter((key) => isStringDictionaryKey(key));

	const cacheKeySize = cacheKeys.length;

	// The limit hasn't been reached yet so don't do anything
	if (cacheKeySize < gSettings.cacheSize) return;

	/** So we don't load up everything into memory unreasonably */
	async function* processCachedDataBatchByBatch(
		keys: ReadonlyArray<DictionaryWordIndexeddbKey>,
		batchSize: number,
	): AsyncGenerator<ReadonlyArray<DictionaryWordIndexeddbValue>> {
		const batch: Promise<DictionaryWordIndexeddbValue | undefined>[] = [];

		async function resolveBatch(
			batch: Promise<DictionaryWordIndexeddbValue | undefined>[],
		): Promise<ReadonlyArray<DictionaryWordIndexeddbValue>> {
			return Promise.allSettled(batch).then((results) =>
				results.reduce<DictionaryWordIndexeddbValue[]>((acc, val) => {
					if (val.status === "fulfilled" && val.value) {
						acc.push(val.value);
					}

					return acc;
				}, []),
			);
		}

		for (const key of keys) {
			batch.push(idb.get(key));

			if (batch.length === batchSize) {
				yield resolveBatch(batch);
				batch.length = 0;
			}
		}

		if (batch.length) {
			yield resolveBatch(batch);
		}
	}

	for await (const batch of processCachedDataBatchByBatch(
		cacheKeys,
		gSettings.cleanup.batchSize,
	)) {
		const keysToDelete: DictionaryWordIndexeddbKey[] = [];

		batch.forEach((val) => {
			const key = getCacheKeyFromDictionaryResult(val.data);

			if (isCachedEntryExpired(val)) keysToDelete.push(key);

			// REVIEW: Should non-expired entries be deleted if we're still above the size limit?
		});

		await idb.del(...keysToDelete);
	}
}

function getNameOfDictionaryApi(api: DictionaryApis) {
	switch (api) {
		case DATAMUSE:
			return "Datamuse";

		case GOOGLE_DICTIONARY_API:
			return "Google Dictionary";

		case FREE_DICTIONARY:
			return "Free Dictionary";

		case URBAN_DICTIONARY:
			return "Urban Dictionary";

		default:
			return "Null";
	}
}

async function getSearchSuggestions(
	input: string,
): Promise<ReadonlyArray<string>> {
	const suggestionArrayPromises: Array<Promise<ReadonlyArray<string>>> = [];

	if (gSettings.dictionaries.has(DATAMUSE))
		suggestionArrayPromises.push(
			getSearchSuggestionsFromDatamuseApi({ word: input }),
		);

	if (gSettings.dictionaries.has(URBAN_DICTIONARY))
		suggestionArrayPromises.push(
			getSearchSuggestionsFromUrbanDictionaryApi(input),
		);

	const fulfilledSuggestionArray = (
		await Promise.allSettled(suggestionArrayPromises)
	).reduce<string[]>((acc, val) => {
		if (val.status === "fulfilled") acc.push(...val.value);

		return acc;
	}, []);

	return [
		...new Set(fulfilledSuggestionArray.map((val) => val.toLocaleLowerCase())),
	];
}

export {
	fetchDictionaryResult,
	cleanupExpiredCachedEntriesWhenAboveSizeLimit,
	getNameOfDictionaryApi,
	getSearchSuggestions,
};
