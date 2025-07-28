import * as v from "valibot";

const UrlString = v.pipe(v.string(), v.url(), v.brand("url"));

type UrlString = v.InferOutput<typeof UrlString>;

export { UrlString };
