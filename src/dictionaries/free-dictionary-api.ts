import * as v from "valibot";
import { DICTIONARY_API } from "~/shared/enums";
import {
	type DictionaryWordResult,
	IpaPhoneticSchema,
} from "~/types/dictionary";
import { PartOfSpeech, StringArraySchema, UrlString } from "~/types/schema";
import { getRandomElementInArray } from "~/utils/other";

const { FREE_DICTIONARY } = DICTIONARY_API;

const LanguageSchema = v.object({
	/** ISO 639-1/639-3 (2 or 3 letter) language code */
	code: v.pipe(v.string(), v.minLength(2), v.maxLength(3)),

	/** The full name of this language in English */
	name: v.string(),
});

type LanguageOutput = v.InferOutput<typeof LanguageSchema>;

type SensesOutput = {
	definition: string;
	tags: string[];
	examples: string[];
	quotes: Array<{ text: string; reference: string }>;
	synonyms: string[];
	antonyms: string[];
	translations?: Array<{ language: LanguageOutput; word: string }> | undefined;

	subsenses: SensesOutput[];
};

/** One specific meaning of a word with examples and related information */
const SensesSchema: v.GenericSchema<SensesOutput> = v.object({
	/** What this meaning of the word means */
	definition: v.string(),

	/** Labels about how this meaning is used (formal, old-fashioned, technical, etc.) */
	tags: StringArraySchema,

	/** Example sentences showing how to use this meaning */
	examples: StringArraySchema,

	/** Real quotes from books or other sources using this word */
	quotes: v.array(
		v.object({
			/** The actual quote text. */
			text: v.string(),

			/** Where this quote came from (book title, author, etc.). */
			reference: v.string(),
		}),
	),

	/** Words that mean the same as this specific meaning */
	synonyms: StringArraySchema,

	/** Words that mean the opposite of this specific meaning */
	antonyms: StringArraySchema,

	/** How to say this meaning in other languages. */
	translations: v.optional(
		v.array(
			v.object({
				/** Information about a language */
				language: LanguageSchema,

				/** The word or phrase in that language */
				word: v.string(),
			}),
		),
	),

	/** More specific meanings within this meaning */
	subsenses: v.array(v.lazy(() => SensesSchema)),
});

const ResponseSchema = v.object({
	/** The word being looked up */
	word: v.string(),

	/** All dictionary entries for this word in different languages and contexts */
	entries: v.array(
		v.object({
			/** Information about a language */
			language: LanguageSchema,

			/** What type of word this is (noun, verb, adjective, etc.) */
			partOfSpeech: PartOfSpeech,

			/** How to pronounce a word using phonetic symbols */
			pronunciations: v.array(
				v.variant("type", [
					v.object({
						/** The type of pronunciation (like "ipa", "enpr", etc.) */
						type: v.literal("ipa"),

						/** The pronunciation written in the specified notation */
						text: IpaPhoneticSchema,

						/** Labels describing this pronunciation (like dialect or formality level) e.g "General American", "UK", "Ireland", "Northern England" */
						tags: StringArraySchema,
					}),

					v.object({
						/** The type of pronunciation (like "ipa", "enpr", etc.) */
						type: v.literal("enpr"),

						/** The pronunciation written in the specified notation */
						text: v.string(),

						/** Labels describing this pronunciation (like dialect or formality level) e.g "General American", "UK", "Ireland", "Northern England" */
						tags: StringArraySchema,
					}),
				]),
			),

			/** Different forms of this word (like plural, past tense) */
			forms: v.array(
				v.object({
					/** The different form of this word, e.g runs, running, ran, */
					word: v.string(),

					/** Labels describing what kind of form this is (plural, past tense, etc.) */
					tags: StringArraySchema,
				}),
			),

			/** All the different meanings of this word */
			senses: v.array(SensesSchema),

			/** Words that mean the same thing as this word (for the whole entry) */
			synonyms: StringArraySchema,

			/** Words that mean the opposite of this word (for the whole entry) */
			antonyms: StringArraySchema,
		}),
	),

	/** Information about where the dictionary data comes from */
	source: v.object({
		/** Link to the original Wiktionary page. */
		url: UrlString,

		/** Legal terms for using the dictionary data */
		license: v.object({
			/** Name of the license */
			name: v.string(),

			/** Link to read the full license terms */
			url: UrlString,
		}),
	}),
});

type ResponseOutput = v.InferOutput<typeof ResponseSchema>;

async function fetchResponse(word: string): Promise<ResponseOutput | null> {
	try {
		const URL = `${FREE_DICTIONARY}/api/v1/entries/en` as const;

		const fetchedData = await (await fetch(`${URL}/${word}`)).json();

		return v.parse(ResponseSchema, fetchedData);
	} catch (e) {
		console.warn(
			"Error when searching for '",
			word,
			"' with Free Dictionary Api: ",
			e,
		);

		return null;
	}
}

function convertResponseToDictionaryResult(
	response: ResponseOutput,
): DictionaryWordResult | null {
	const { entries, word } = response;

	const [
		partsOfSpeech,
		ipaPhonetics,
		definitions,
		examples,
		synonyms,
		antonyms,
	] = entries.reduce<
		[
			PartOfSpeech[],
			DictionaryWordResult["phonetics"][],
			DictionaryWordResult["definitions"],
			DictionaryWordResult["examples"],
			DictionaryWordResult["related"]["synonyms"],
			DictionaryWordResult["related"]["antonyms"],
		]
	>(
		(acc, { partOfSpeech, pronunciations, senses }) => {
			acc[0].push(partOfSpeech);

			acc[1].push(
				...pronunciations.reduce<DictionaryWordResult["phonetics"][]>(
					(acc, val) => {
						if (val.type === "ipa") {
							acc.push(val.text);
						}

						return acc;
					},
					[],
				),
			);

			function extractDataFromSensesRecursively(
				partOfSpeech: PartOfSpeech,
				senses: SensesOutput,
			): [
				DictionaryWordResult["definitions"],
				DictionaryWordResult["examples"],
				DictionaryWordResult["related"]["synonyms"],
				DictionaryWordResult["related"]["antonyms"],
			] {
				const { antonyms, definition, examples, quotes, subsenses, synonyms } =
					senses;

				// Initialize accumulators with data from the current sense
				const allDefinitions: DictionaryWordResult["definitions"] = definition
					? [{ definition, partOfSpeech }]
					: [];
				const allExamples: DictionaryWordResult["examples"] = [
					...examples.map((example) => ({ example, partOfSpeech })),
					...quotes.map(({ text }) => ({ example: text, partOfSpeech })),
				];
				const allSynonyms: DictionaryWordResult["related"]["synonyms"] = [
					...synonyms,
				];
				const allAntonyms: DictionaryWordResult["related"]["antonyms"] = [
					...antonyms,
				];

				// If there are subsenses, recursively process them and merge the results
				if (subsenses) {
					for (const subsense of subsenses) {
						const [childDefs, childExs, childSyns, childAnts] =
							extractDataFromSensesRecursively(partOfSpeech, subsense);

						allDefinitions.push(...childDefs);
						allExamples.push(...childExs);
						allSynonyms.push(...childSyns);
						allAntonyms.push(...childAnts);
					}
				}

				return [allDefinitions, allExamples, allSynonyms, allAntonyms];
			}

			const [definitions, examples, synonyms, antonyms] = senses.reduce<
				[
					DictionaryWordResult["definitions"],
					DictionaryWordResult["examples"],
					DictionaryWordResult["related"]["synonyms"],
					DictionaryWordResult["related"]["antonyms"],
				]
			>(
				(acc, senses) => {
					const [definitions, examples, synonyms, antonyms] =
						extractDataFromSensesRecursively(partOfSpeech, senses);

					acc[0].push(...definitions);

					acc[1].push(...examples);

					acc[2].push(...synonyms);

					acc[3].push(...antonyms);

					return acc;
				},
				[[], [], [], []],
			);

			acc[2].push(...definitions);

			acc[3].push(...examples);

			acc[4].push(...synonyms);

			acc[5].push(...antonyms);

			return acc;
		},
		[[], [], [], [], [], []],
	);

	return {
		audioUrl: null,
		definitions,
		examples,
		frequency: null,
		name: word,
		originApi: FREE_DICTIONARY,
		partOfSpeech: partsOfSpeech,
		phonetics: getRandomElementInArray(ipaPhonetics) ?? "[]",
		related: { antonyms, synonyms },
	};
}

async function queryWordForDictionaryResult(
	word: string,
): Promise<DictionaryWordResult | null> {
	const response = await fetchResponse(word);

	if (response) return convertResponseToDictionaryResult(response);

	return null;
}

export { queryWordForDictionaryResult };
