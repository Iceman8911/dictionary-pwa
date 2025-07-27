import type { DICTIONARY_API } from "~/shared/enums";

type GlobalSettings = {
	/** Selected dictionaries that search queries would be run against.
	 *
	 * Intially defaults to only DATAMUSE
	 */
	dictionaries: Set<DICTIONARY_API>;

	/** Metadata to know when the last save occurred */
	savedOn: Date;

	/** How long, in milliseconds, until the data for a search query should be refetched from the internet (if there's no internet, the cache will still be used).
	 *
	 * **Expired items will not be removed**
	 */
	cacheDuration: number;

	/** Maximum amount of search queries that can be cached before older entries get replaced */
	cacheSize: number;

	/** Settings related to the cleanup process that regularly occurs */
	cleanup: {
		/** Time in milliseconds till expired cached entries will be attempted to be removed */
		interval: number;

		/** Amount of cache entries to be processed and loaded into memory when cleanup begins */
		batchSize: number;
	};
};

export type { GlobalSettings };
