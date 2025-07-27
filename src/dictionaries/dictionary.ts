import { DICTIONARY_API } from "~/shared/enums";
import type {
	DictionaryIndexeddbKey,
	DictionaryWordResult,
} from "~/types/dictionary";
import { searchForWordDefinitionAndSynonyms } from "./datamuse";
import * as idb from "~/utils/idb";
import { gSettings } from "~/shared/store";
import { gIsUserConnectedToInternet } from "~/utils/internet";

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

	const cacheKey: DictionaryIndexeddbKey = `${api}-${word}`;

	const cachedData = await idb.get(cacheKey);

	// If the cache is present and has not expired or the user is offline
	if (
		(cachedData &&
			cachedData.cachedOn.getTime() + gSettings.cacheDuration > Date.now()) ||
		!(await gIsUserConnectedToInternet())
	) {
		return cachedData!.data;
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

export { fetchDictionaryResult };
