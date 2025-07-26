import type { DICTIONARY_API } from "~/shared/enums";

type GlobalSettings = {
	/** Selected dictionaries that search queries would be run against.
	 *
	 * Intially defaults to only DATAMUSE
	 */
	dictionaries: Set<DICTIONARY_API>;

	/** Metadata to know when the last save occurred */
	savedOn: Date;
};

export type { GlobalSettings };
