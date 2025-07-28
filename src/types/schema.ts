import * as v from "valibot";

const UrlString = v.pipe(v.string(), v.url(), v.brand("url"));

type UrlString = v.InferOutput<typeof UrlString>;

const StringArraySchema = v.array(v.string());

const PartOfSpeech = v.union([
	v.literal("noun"),
	v.literal("pronoun"),
	v.literal("verb"),
	v.literal("adjective"),
	v.literal("adverb"),
	v.literal("preposition"),
	v.literal("conjunction"),
	v.literal("interjection"),
	v.literal("article"),
	v.literal("determiner"),
]);

type PartOfSpeech = v.InferOutput<typeof PartOfSpeech>;

export { UrlString, StringArraySchema, PartOfSpeech };
