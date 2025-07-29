import * as v from "valibot";
import { DICTIONARY_API } from "~/shared/enums";
import type { DictionaryWordResult } from "~/types/dictionary";
import { BooleanString, HttpStatusCode, NumberString } from "~/types/schema";

const { URBAN_DICTIONARY } = DICTIONARY_API;

const ResponseSchema = v.object({
	/** Should be in the 200 range if successful */
	statusCode: HttpStatusCode,

	/** The searched word or phrase */
	term: v.string(),

	/** Whether `data` will be populated */
	found: BooleanString,

	params: v.object({
		/** Whether to return only exact matches **Eg. return only "bigger" and not "biggering", "biggered"** */
		strict: BooleanString,

		limit: NumberString,

		matchCase: BooleanString,

		scrapeType: v.union([
			v.literal("search"),
			v.literal("random"),
			v.literal("browse"),
			v.literal("author"),
			v.literal("date"),
		]),

		/** Eg. page = 5, get all definitions from the 5th page only */
		page: NumberString,

		/** 'false' or stuff like '2,4' where '2,4' will return all definitions from page 2 to page 4*/
		multiPage: v.pipe(
			v.string(),
			v.custom<`${number},${number}` | "false">((str) => {
				if (typeof str !== "string") return false;

				const booleanStringParse = v.safeParse(BooleanString, str);

				if (booleanStringParse.success) return true;

				const [minPageNumberString, maxPageNumberString] = str.split(",");

				const minPageNumber = Number(minPageNumberString);

				const maxPageNumber = Number(maxPageNumberString);

				if (
					!Number.isNaN(minPageNumber) &&
					!Number.isNaN(maxPageNumber) &&
					maxPageNumber >= minPageNumber
				)
					return true;

				return false;
			}),
		),
	}),

	/** Number of pages the results were extracted from */
	totalPages: v.number(),

	/** The real useful stuff */
	data: v.array(
		v.object({
			word: v.string(),

			meaning: v.string(),

			example: v.string(),

			/** Account that uploaded this meaning */
			contributor: v.string(),

			/** e.g "February 04, 2004" */
			date: v.string(),
		}),
	),
});

type ResponseOutput = v.InferOutput<typeof ResponseSchema>;

async function fetchResponse(
	word: string,
	maxResults: number,
): Promise<ResponseOutput | null> {
	try {
		const URL =
			`${URBAN_DICTIONARY}/api/search?term=${word}&limit=${maxResults}&` as const;

		const fetchedData = await (await fetch(URL)).json();

		const parsedData = v.parse(ResponseSchema, fetchedData);

		return parsedData;
	} catch (e) {
		console.warn(
			"Error when searching for '",
			word,
			"' with Urban Dictionary Api: ",
			e,
		);

		return null;
	}
}

function convertResponseToDictionaryResult(
	response: ResponseOutput | null,
): DictionaryWordResult | null {
	if (!response) return null;

	const { data, term } = response;

	const [definitions, examples] = data.reduce<
		[DictionaryWordResult["definitions"], DictionaryWordResult["examples"]]
	>(
		(acc, { example, meaning }) => {
			acc[0].push({ definition: meaning, partOfSpeech: null });

			acc[1].push({ example, partOfSpeech: null });

			return acc;
		},
		[[], []],
	);

	return {
		audioUrls: [],
		definitions,
		examples,
		frequency: null,
		name: term,
		originApi: URBAN_DICTIONARY,
		partsOfSpeech: [],
		phonetics: [],
		related: { antonyms: [], synonyms: [] },
	};
}

async function queryWordForDictionaryResult(
	word: string,
	maxResults: number,
): Promise<DictionaryWordResult | null> {
	return convertResponseToDictionaryResult(
		await fetchResponse(word, maxResults),
	);
}

export { queryWordForDictionaryResult };
