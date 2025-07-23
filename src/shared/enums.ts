/** For keeping track of queries */
export const QUERY_NAME = {
	IS_CONNECTED: "isConnected",
	SEARCH_SUGGESTIONS: "searchSuggestions",
};

export type QUERY_NAME = (typeof QUERY_NAME)[keyof typeof QUERY_NAME];
