import { query } from "@solidjs/router";
import * as v from "valibot";
import { DICTIONARY_API, QUERY_NAME } from "~/shared/enums";
import { ABORT_EARLY_CONFIG } from "~/shared/valibot";
import type { DictionaryWordResult } from "~/types/dictionary";

type PartOfSpeech = DictionaryWordResult["partsOfSpeech"][0];

const { DATAMUSE: DATAMUSE_BASE_URL } = DICTIONARY_API;

const WORDS_ENDPOINT = `${DATAMUSE_BASE_URL}/words`;

const SUGGESTION_ENDPOINT = `${DATAMUSE_BASE_URL}/sug`;

const GenericPayloadSchema = v.object({
	/** Max value of 1000
	 *
	 * Default of 10
	 */
	maxResults: v.optional(
		v.pipe(
			v.number(),
			v.transform((num) => num % 1001),
		),
		10,
	),
	word: v.string(),
});

const SuggestionPayloadSchema = GenericPayloadSchema;

type SuggestionPayloadInput = v.InferInput<typeof SuggestionPayloadSchema>;

const SuggestionResponseSchema = v.pipe(
	v.array(
		v.pipe(
			v.object({
				/** Ranking of this word compared to others in the array.
				 *
				 * Higher is better
				 */
				score: v.number(),
				/** A suggested word */
				word: v.string(),
			}),
			v.readonly(),
		),
	),
	v.readonly(),
);

const getSearchSuggestions = query(
	async (payload: SuggestionPayloadInput): Promise<ReadonlyArray<string>> => {
		try {
			const { word: hint, maxResults } = v.parse(
				SuggestionPayloadSchema,
				payload,
				ABORT_EARLY_CONFIG,
			);

			const res = await (
				await fetch(`${SUGGESTION_ENDPOINT}?s=${hint}&max=${maxResults}`)
			).json();

			const parsedResult = v.parse(
				SuggestionResponseSchema,
				res,
				ABORT_EARLY_CONFIG,
			);

			return parsedResult.map(({ word }) => word);
		} catch {
			return [];
		}
	},
	QUERY_NAME.SEARCH_SUGGESTIONS,
);

const WordSearchPayloadSchema = GenericPayloadSchema;

type WordSearchPayloadInput = v.InferInput<typeof WordSearchPayloadSchema>;

const PARTS_OF_SPEECH = ["n", "N", "v", "adj", "u", "adv", "prop"] as const;
type PARTS_OF_SPEECH = (typeof PARTS_OF_SPEECH)[number];

/**
 * **pron** = space-delimited list of Arpabet phoneme codes
 *
 * **ipa_pron** = IPA phonetics
 *
 * **results_type** = `primary_rel` ??? No Idea what it is :(. The documentation doesn't say anything about it
 *
 * **f** = number of occurences in a random million word sample
 */
const METADATA = [
	"pron",
	"ipa_pron",
	"results_type",
	"f",

	"cluster",
	"cluster_distances",
	"cluster_titles",
	"cluster_top",
] as const;
type METADATA = (typeof METADATA)[number];

const PartOfSpeechOrUnknownSchema = v.union(
	PARTS_OF_SPEECH.map((pos) => v.literal(pos)),
);

const SynonymOrAntonymSchema = v.union([v.literal("syn"), v.literal("ant")]);

const WordSearchResponseSchema = v.pipe(
	v.array(
		v.pipe(
			v.object({
				/** If the word is an inflected form (such as the plural of a noun or a conjugated form of a verb), then an additional `defHeadword` field will be added indicating the base form from which the definitions are drawn */
				defHeadword: v.optional(v.string(), ""),

				/** Definitions for th word */
				defs: v.optional(
					v.array(
						v.union(
							PARTS_OF_SPEECH.map((pos) =>
								v.pipe(v.string(), v.startsWith(`${pos}\t`)),
							),
						),
					),
					[],
				),

				/** Ranking of the word in relation to the others in the array */
				score: v.optional(v.number()),

				/** Extra metadata about the word such as it's part of speech, IPA phonetics, etc */
				tags: v.array(
					v.union([
						PartOfSpeechOrUnknownSchema,
						SynonymOrAntonymSchema,
						...METADATA.map((val) =>
							v.pipe(v.string(), v.startsWith(`${val}:`)),
						),
					]),
				),
				/** A word that matches the search query */
				word: v.string(),
			}),
			v.readonly(),
		),
	),
	v.readonly(),
);

type WordSearchResponseOutput = v.InferOutput<typeof WordSearchResponseSchema>;

type WordSearchResponseOutputDefinitionAndRelated = {
	main: WordSearchResponseOutput[0];
	synonyms: WordSearchResponseOutput;
	antonyms: WordSearchResponseOutput;
	/** The original search term */
	searchTerm: string;
};

function convertWordSearchResponseOutputToDictionarySchema(
	response: WordSearchResponseOutputDefinitionAndRelated,
): DictionaryWordResult | null {
	function calculateFrequencyRating(
		/** Out of a million */
		frequency: number,
	): DictionaryWordResult["frequency"] {
		if (frequency > 1000) return "very common";

		if (frequency > 400) return "common";

		if (frequency > 40) return "uncommon";

		if (frequency > 10) return "rare";

		return "very rare";
	}

	/** To turn it to more consistent values */
	function parsePartOfSpeech(partOfSpeech: PARTS_OF_SPEECH): PartOfSpeech {
		switch (partOfSpeech) {
			case "n":
			case "N":
				return "noun";
			case "v":
				return "verb";
			case "adj":
				return "adjective";
			case "u":
				return null;
			case "adv":
				return "adverb";
			case "prop":
				return "preposition";
		}
	}

	/**
	 *
	 * @param definition - Will be a string like `"adj\t(comparable) Having numerous possibilities or implications; full of promise; abounding in ability, resources, etc. "`
	 */
	function extractPartOfSpeechFromDefinition(
		definition: Readonly<string>,
	): DictionaryWordResult["definitions"][0] {
		const [partOfSpeech, otherDefinition] = definition.split("\t");

		const parsedPartOfSpeech = v.parse(
			PartOfSpeechOrUnknownSchema,
			partOfSpeech,
		);

		return {
			definition: (otherDefinition ?? "").trim(),
			partOfSpeech: parsePartOfSpeech(parsedPartOfSpeech),
		};
	}

	function extractMetadataFromTags(tags: ReadonlyArray<string>): {
		partOfSpeech: PartOfSpeech[];
		frequency: DictionaryWordResult["frequency"];
		phonetics: DictionaryWordResult["phonetics"];
	} {
		const partOfSpeech: PartOfSpeech[] = [];

		let frequencyValue: number = 0;

		let phonetics: DictionaryWordResult["phonetics"] = [];

		for (const tag of tags) {
			const possiblePartOfSpeech = v.safeParse(
				PartOfSpeechOrUnknownSchema,
				tag,
			);

			if (possiblePartOfSpeech.success) {
				partOfSpeech.push(parsePartOfSpeech(possiblePartOfSpeech.output));
			} else {
				// The tag is something like "f:2121.233", "ipa_pron:bɪkˈʌmz", etc
				const [intialTagPart, tagValue] = tag.split(":") as [METADATA, string];

				switch (intialTagPart) {
					case "pron": {
						// Not using this
						break;
					}

					case "ipa_pron": {
						phonetics = [`[${tagValue}]`];
						break;
					}

					case "results_type": {
						// Not using this
						break;
					}

					case "f": {
						frequencyValue = Number(tagValue);
					}
				}
			}
		}

		return {
			frequency: calculateFrequencyRating(frequencyValue),
			partOfSpeech,
			phonetics,
		};
	}

	const {
		antonyms: antonymWordsResponse,
		main: mainWordsResponse,
		searchTerm,
		synonyms: synonymWordsResponse,
	} = response;

	if (mainWordsResponse) {
		const { frequency, partOfSpeech, phonetics } = extractMetadataFromTags(
			mainWordsResponse.tags,
		);

		const mainDictionaryResult: DictionaryWordResult = {
			audioUrls: [],
			definitions: mainWordsResponse.defs.map((val) =>
				extractPartOfSpeechFromDefinition(val),
			),
			examples: [],
			frequency,
			name: searchTerm,
			originApi: DATAMUSE_BASE_URL,
			partsOfSpeech: partOfSpeech,
			phonetics,
			related: { antonyms: [], synonyms: [] },
		};

		const enhancedDictionaryResult: DictionaryWordResult = {
			...mainDictionaryResult,
			// TODO
			related: {
				...mainDictionaryResult.related,
				antonyms: antonymWordsResponse.reduce<string[]>((acc, val) => {
					if (val) acc.push(val.word);

					return acc;
				}, []),
				synonyms: synonymWordsResponse.reduce<string[]>((acc, val) => {
					if (val) acc.push(val.word);

					return acc;
				}, []),
			},
		};

		return enhancedDictionaryResult;
	}

	return null;
}

async function queryWordForDictionaryResult(
	payload: WordSearchPayloadInput,
): Promise<DictionaryWordResult | null> {
	try {
		const { word, maxResults } = v.parse(
			WordSearchPayloadSchema,
			payload,
			ABORT_EARLY_CONFIG,
		);

		// Fetch the exact word and it's related words
		const exactWordsResponse = fetch(
			`${WORDS_ENDPOINT}?sp=${word}&md=dprf&max=3&ipa=1`,
		)
			.then((res) => res.json())
			.then((json) => v.parse(WordSearchResponseSchema, json));

		const synonymWordsResponse = fetch(
			`${WORDS_ENDPOINT}?ml=${word}&md=dprf&max=${maxResults}&ipa=1`,
		)
			.then((res) => res.json())
			.then((json) => v.parse(WordSearchResponseSchema, json));

		const antonymWordsResponse = fetch(
			`${WORDS_ENDPOINT}?rel_ant=${word}&md=dprf&max=${maxResults}&ipa=1`,
		)
			.then((res) => res.json())
			.then((json) => v.parse(WordSearchResponseSchema, json));

		const [parsedPossibleExactWords, parsedSynonymWords, parsedAntonymWords] =
			await Promise.all([
				exactWordsResponse,
				synonymWordsResponse,
				antonymWordsResponse,
			]);

		// Required for cases like "read-only", where the first result is "read", and the second is actually "read-only"
		const parsedExactWord = parsedPossibleExactWords.filter(
			(val) => val?.word.toLocaleLowerCase() === word.toLocaleLowerCase(),
		)[0];

		if (!parsedExactWord) return null;

		// REVIEW: Maybe normalize the scores of the related words to be between 0 and 1. While the exact word will be 1

		return convertWordSearchResponseOutputToDictionarySchema({
			antonyms: parsedAntonymWords,
			main: parsedExactWord,
			searchTerm: word,
			synonyms: parsedSynonymWords,
		});
	} catch (e) {
		console.warn(
			"Error when searching for '",
			payload.word,
			"' with Datamuse: ",
			e,
		);
	}

	return null;
}

export { getSearchSuggestions, queryWordForDictionaryResult };
