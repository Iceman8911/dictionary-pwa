import { DICTIONARY_API } from "~/shared/enums";
import { gSettings } from "~/shared/store";
import type {
	DictionaryWordIndexeddbKey,
	DictionaryWordIndexeddbValue,
	DictionaryWordResult,
} from "~/types/dictionary";
import * as idb from "~/utils/idb";
import { gIsUserConnectedToInternet } from "~/utils/internet";
import { searchForWordDefinitionAndSynonyms } from "./datamuse";

/** Attempts to get the dictionary results of a particular word.
 *
 * @param payload `dictionary`: If not explicitly given, tries a dicitionary and repeatedly falls back to unused ones if the previous try returns `null`. If explicitly given, no fallbacks will occur
 */
async function fetchDictionaryResult(payload: {
	word: string;
	maxResults?: number;
	dictionary?: DICTIONARY_API;
}): Promise<DictionaryWordResult | null> {
	const { word, dictionary, maxResults = 10 } = payload;

	// If a specific dictionary is provided, just use that one.
	if (dictionary) {
		return fetchFromApi(dictionary, word, maxResults);
	}

	const APIS_TO_TRY = Object.values(DICTIONARY_API);

	for (const api of APIS_TO_TRY) {
		const result = await fetchFromApi(api, word, maxResults);

		if (result) return result;
	}

	// No dictionary api was explicitly given and none of the ones we tried worked
	return null;
}

async function fetchFromApi(
	api: DICTIONARY_API,
	word: string,
	maxResults: number,
): Promise<DictionaryWordResult | null> {
	const {
		DATAMUSE,
		DICTIONARY_API: DICTIONARY_API_1,
		FREE_DICTIONARY: DICTIONARY_API_2,
	} = DICTIONARY_API;

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
			fetchedData = await searchForWordDefinitionAndSynonyms({
				word,
				maxResults,
			});

			break;
		}

		case DICTIONARY_API_1: {
			fetchedData = null;

			break;
		}

		case DICTIONARY_API_2: {
			fetchedData = null;

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
	return Object.values(DICTIONARY_API).includes(
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
		batch.forEach((val) => {
			const key = getCacheKeyFromDictionaryResult(val.data);

			if (isCachedEntryExpired(val))
				// We can afford to not `await` this
				idb.del(key);

			// REVIEW: Should non-expired entries be deleted if we're still above the size limit?
		});
	}
}

export { fetchDictionaryResult, cleanupExpiredCachedEntriesWhenAboveSizeLimit };
