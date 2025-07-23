import { query } from "@solidjs/router";
import * as v from "valibot";
import { QUERY_NAME } from "~/shared/enums";
import { ABORT_EARLY_CONFIG } from "~/shared/valibot";
import { gIsUserConnectedToInternet } from "~/utils/internet";

const BASE_URL = "https://api.datamuse.com";

const WORDS_ENDPOINT = `${BASE_URL}/words`;

const SUGGESTION_ENDPOINT = `${BASE_URL}/sug`;

const SuggestionPayloadSchema = v.object({
	hint: v.pipe(
		v.string(),
		v.transform((str) => str.replaceAll(" ", "+")),
	),

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
});

type SuggestionPayloadInput = v.InferInput<typeof SuggestionPayloadSchema>;

const SuggestionResponseSchema = v.pipe(
	v.array(
		v.object({
			/** A suggested word */
			word: v.pipe(v.string(), v.readonly()),

			/** Ranking of this word compared to others in the array.
			 *
			 * Higher is better
			 */
			score: v.pipe(v.number(), v.readonly()),
		}),
	),
	v.readonly(),
);

type SuggestionResponseOutput = v.InferOutput<typeof SuggestionResponseSchema>;

const getSearchSuggestions = query(
	async (
		payload: SuggestionPayloadInput,
	): Promise<SuggestionResponseOutput> => {
		if (await gIsUserConnectedToInternet()) {
			const { hint, maxResults } = v.parse(
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

			return parsedResult;
		}

		return [];
	},
	QUERY_NAME.SEARCH_SUGGESTIONS,
);

const WordSearchPayloadSchema = v.object({
	word: v.pipe(
		v.string(),
		v.transform((str) => str.replaceAll(" ", "+")),
	),

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
});

type WordSearchPayloadInput = v.InferInput<typeof WordSearchPayloadSchema>;

const PartOfSpeechOrUnknownSchema = v.union([
	v.literal("n"),
	v.literal("v"),
	v.literal("adj"),
	v.literal("u"),
	v.literal("adv"),
	v.literal("prop"),
]);

const SynonymOrAntonymSchema = v.union([v.literal("syn"), v.literal("ant")]);

const WordSearchResponseSchema = v.pipe(
	v.array(
		v.pipe(
			v.object({
				/** A word that matches the search query */
				word: v.string(),

				/** Ranking of the word in relation to the others in the array */
				score: v.number(),

				defs: v.optional(
					v.array(
						v.union([
							v.pipe(v.string(), v.startsWith("n\t")),
							v.pipe(v.string(), v.startsWith("v\t")),
							v.pipe(v.string(), v.startsWith("u\t")),
							v.pipe(v.string(), v.startsWith("adj\t")),
						]),
					),
					[],
				),

				defHeadword: v.optional(v.string(), ""),

				tags: v.array(
					v.union([
						PartOfSpeechOrUnknownSchema,
						SynonymOrAntonymSchema,
						v.pipe(v.string(), v.startsWith("pron:")),
						v.pipe(v.string(), v.startsWith("ipa_pron:")),
						v.pipe(v.string(), v.startsWith("results_type:")),
					]),
				),
			}),
			v.readonly(),
		),
	),
	v.readonly(),
);

type WordSearchResponseOutput = v.InferOutput<typeof WordSearchResponseSchema>;

async function searchForWordDefinitionAndSynonyms(
	payload: WordSearchPayloadInput,
): Promise<WordSearchResponseOutput> {
	if (await gIsUserConnectedToInternet()) {
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

		const relatedWordsResponse = fetch(
			`${WORDS_ENDPOINT}?ml=${word}&md=dprf&max=${maxResults}&ipa=1`,
		)
			.then((res) => res.json())
			.then((json) => v.parse(WordSearchResponseSchema, json));

		const [parsedExactWords, parsedRelatedWords] = await Promise.all([
			exactWordsResponse,
			relatedWordsResponse,
		]);

		// REVIEW: Maybe normalize the scores of the related words to be between 0 and 1. While the exact word will be 1

		return [parsedExactWords, parsedRelatedWords].flat();
	}

	return Promise.resolve([]);
}

export {
	getSearchSuggestions,
	searchForWordDefinitionAndSynonyms,
	type WordSearchResponseOutput,
};
