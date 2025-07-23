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
	 * Default of ten
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

			const parsedResult = v.parse(SuggestionResponseSchema, res);

			return parsedResult;
		}

		return [];
	},
	QUERY_NAME.SEARCH_SUGGESTIONS,
);

export { getSearchSuggestions };
