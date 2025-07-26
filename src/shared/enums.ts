/** For keeping track of queries */
const QUERY_NAME = {
	IS_CONNECTED: "isConnected",
	SEARCH_SUGGESTIONS: "searchSuggestions",
} as const;

type QUERY_NAME = (typeof QUERY_NAME)[keyof typeof QUERY_NAME];

/** TODO: Each entry must link to it's corresponding api url */
const DICTIONARY_API = {
	/** https://www.datamuse.com/api */
	DATAMUSE: "https://api.datamuse.com",

	/** https://dictionaryapi.dev */
	DICTIONARY_API: "dictApi",

	/** https://freedictionaryapi.com */
	FREE_DICTIONARY: "freeDictApi",
} as const;

type DICTIONARY_API = (typeof DICTIONARY_API)[keyof typeof DICTIONARY_API];

export { QUERY_NAME, DICTIONARY_API };
