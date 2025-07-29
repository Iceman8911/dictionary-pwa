import * as v from "valibot";
import type { DICTIONARY_API } from "~/shared/enums";
import type { PartOfSpeech, UrlString } from "./schema";

type NullishPartOfSpeech = PartOfSpeech | null;

/** Main structure of parsed and stored data for each word */
type DictionaryWordResult = Readonly<{
	name: string;

	/** IPA phonetics */
	phonetics: Array<IpaPhonetic>;

	partsOfSpeech: NullishPartOfSpeech[];

	/** The API that this data was generated from */
	originApi: DICTIONARY_API;

	definitions: { partOfSpeech: NullishPartOfSpeech; definition: string }[];

	/** Contextual examples of the word in use */
	examples: { partOfSpeech: NullishPartOfSpeech; example: string }[];

	related: {
		synonyms: string[];
		antonyms: string[];
	};

	audioUrls: UrlString[];

	frequency:
		| "very common"
		| "common"
		| "uncommon"
		| "rare"
		| "very rare"
		| null;
}>;

/** The api's url and the word searched */
type DictionaryWordIndexeddbKey = `${DICTIONARY_API}-${string}`;

type DictionaryWordIndexeddbValue = {
	cachedOn: Date;
	data: DictionaryWordResult;
};

const IpaPhonetic = v.pipe(
	v.custom<`/${string}/` | `[${string}]`>(
		(input) =>
			typeof input === "string" &&
			(/\/.*\//.test(input) || /\[.*\]/.test(input)),
	),
);

type IpaPhonetic = v.InferOutput<typeof IpaPhonetic>;

export {
	type DictionaryWordResult,
	type DictionaryWordIndexeddbKey,
	type DictionaryWordIndexeddbValue,
	IpaPhonetic,
};
