/** For keeping track of queries */
const QUERY_NAME = {
	IS_CONNECTED: "isConnected",
	SEARCH_SUGGESTIONS: "searchSuggestions",
} as const;

type QUERY_NAME = (typeof QUERY_NAME)[keyof typeof QUERY_NAME];

const DICTIONARY_API = {
	/** https://www.datamuse.com/api */
	DATAMUSE: "datamuse",
} as const;

type DICTIONARY_API = (typeof DICTIONARY_API)[keyof typeof DICTIONARY_API];

export { QUERY_NAME, DICTIONARY_API };
