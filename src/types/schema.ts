// Naming scheme for schemas:
// - If only the schema is needed, end the name with "Schema", e.g "LowerCaseSchema"
// - If only the schema and output type are needed, they should have the same name, e.g "UrlString"
// - If the schema, input, and output type are needed, append "Schema" to the schema, "Input" to the input type, and "Output" to the output type, e.g "UsernameSchema", "UsernameInput", and "UsernameOutput"

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
