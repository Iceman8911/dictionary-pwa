import * as v from "valibot";
import { DICTIONARY_API } from "~/shared/enums";
import {
	type DictionaryWordResult,
	IpaPhoneticSchema,
} from "~/types/dictionary";
import { PartOfSpeech, StringArraySchema, UrlString } from "~/types/schema";
import { getRandomElementInArray } from "~/utils/other";

const { GOOGLE_DICTIONARY_API } = DICTIONARY_API;

const LicenseSchema = v.object({
	/** License name: `BY-SA 3.0` */
	name: v.string(),

	/** Url to the license in question */
	url: UrlString,
});

const ResponseSchema = v.pipe(
	v.tuple([
		v.pipe(
			v.object({
				/** The name of the word */
				word: v.string(),

				/** Generic IPA pronounciation */
				phonetic: v.optional(IpaPhoneticSchema),

				phonetics: v.array(
					v.object({
						/** Url to an mp3 pronounciation */
						audio: v.union([UrlString, v.literal("")]),

						/** Url to it's wikimedia source */
						sourceUrl: v.optional(UrlString),

						/** License data */
						license: v.optional(LicenseSchema),

						/** IPA pronounciation */
						text: v.optional(IpaPhoneticSchema),
					}),
				),

				meanings: v.array(
					v.object({
						partOfSpeech: PartOfSpeech,

						/** Each array element will have a seperate definition and maybe synonyms / antonyms that relate to that particular definition */
						definitions: v.array(
							v.object({
								definition: v.string(),

								synonyms: StringArraySchema,

								antonyms: StringArraySchema,

								/** An example sentence that uses the `word` in particular */
								example: v.optional(v.string()),
							}),
						),

						synonyms: StringArraySchema,

						antonyms: StringArraySchema,
					}),
				),

				license: LicenseSchema,

				sourceUrls: v.array(UrlString),
			}),
			v.readonly(),
		),
	]),
	v.readonly(),
);

/** For some reason, it's an array of only one value :p */
type ResponseOutput = v.InferOutput<typeof ResponseSchema>;

async function fetchResponse(word: string): Promise<ResponseOutput | []> {
	try {
		const DEFINITION_URL =
			`${GOOGLE_DICTIONARY_API}/api/v2/entries/en` as const;

		const fetchedData = await (await fetch(`${DEFINITION_URL}/${word}`)).json();

		return v.parse(ResponseSchema, fetchedData);
	} catch {
		return [];
	}
}

function convertResponseToDictionaryResult(
	response: ResponseOutput | [],
): DictionaryWordResult | null {
	if (!response[0]) return null;

	const { meanings, phonetic, phonetics, word } = response[0];

	const [ipaPhonetics, audioUrls] = phonetics.reduce<
		readonly [DictionaryWordResult["phonetics"][], UrlString[]]
	>(
		(acc, { audio, text }) => {
			if (audio) acc[1].push(audio);

			if (text) acc[0].push(text);

			return acc;
		},
		[phonetic ? [phonetic] : [], []],
	);

	const [partOfSpeech, definitions, examples, synonyms, antonyms] =
		meanings.reduce<
			[
				PartOfSpeech[],
				DictionaryWordResult["definitions"],
				DictionaryWordResult["examples"],
				DictionaryWordResult["related"]["synonyms"],
				DictionaryWordResult["related"]["antonyms"],
			]
		>(
			(
				acc,
				{
					antonyms: antonymArray,
					definitions: definitionArray,
					partOfSpeech,
					synonyms: synonymArray,
				},
			) => {
				acc[0].push(partOfSpeech);

				const [definitions, synonyms, antonyms, examples] =
					definitionArray.reduce<[string[], string[], string[], string[]]>(
						(acc, { antonyms, definition, synonyms, example }) => {
							acc[0].push(definition);

							acc[1].push(...synonyms);

							acc[2].push(...antonyms);

							if (example) acc[3].push(example);

							return acc;
						},
						[[], [], [], []],
					);

				acc[1].push(
					...definitions.map((definition) => {
						return { definition, partOfSpeech };
					}),
				);

				acc[2].push(
					...examples.map((example) => {
						return { example, partOfSpeech };
					}),
				);

				acc[3].push(...synonymArray, ...synonyms);

				acc[4].push(...antonymArray, ...antonyms);

				return acc;
			},
			[[], [], [], [], []],
		);

	// REVIEW: Maybe pick a fixed value
	return {
		audioUrl: getRandomElementInArray(audioUrls),
		definitions,
		examples,
		frequency: null,
		name: word,
		originApi: GOOGLE_DICTIONARY_API,
		partOfSpeech,
		phonetics: getRandomElementInArray(ipaPhonetics) ?? "[]",
		related: {
			antonyms: [...new Set(antonyms)],
			synonyms: [...new Set(synonyms)],
		},
	};
}

async function queryWordForDictionaryResult(
	word: string,
): Promise<DictionaryWordResult | null> {
	return convertResponseToDictionaryResult(await fetchResponse(word));
}

export { queryWordForDictionaryResult };
