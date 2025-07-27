import type { DICTIONARY_API } from "~/shared/enums";

/** Main structure of parsed and stored data for each word */
type DictionaryWordResult = Readonly<{
	name: string;

	/** IPA phonetics */
	phonetics: `/${string}/` | `[${string}]`;

	partOfSpeech: PartOfSpeech[];

	/** The API that this data was generated from */
	originApi: DICTIONARY_API;

	definitions: { partOfSpeech: PartOfSpeech; definition: string }[];

	/** Contextual examples of the word in use */
	examples: { partOfSpeech: PartOfSpeech; example: string }[];

	related: {
		synonyms: string[];
		antonyms: string[];
	};

	audioUrl: URL | null;

	frequency:
		| "very common"
		| "common"
		| "uncommon"
		| "rare"
		| "very rare"
		| null;
}>;

type PartOfSpeech =
	| "noun"
	| "pronoun"
	| "verb"
	| "adjective"
	| "adverb"
	| "preposition"
	| "conjunction"
	| "interjection"
	| "article"
	| "determiner"
	| null;

/** The api's url and the word searched */
type DictionaryWordIndexeddbKey = `${DICTIONARY_API}-${string}`;

type DictionaryWordIndexeddbValue = {
	cachedOn: Date;
	data: DictionaryWordResult;
};

export type {
	DictionaryWordResult,
	PartOfSpeech,
	DictionaryWordIndexeddbKey,
	DictionaryWordIndexeddbValue,
};
