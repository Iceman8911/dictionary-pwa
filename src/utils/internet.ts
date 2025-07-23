import { query } from "@solidjs/router";
import { QUERY_NAME } from "~/shared/enums";

async function isUserConnectedToInternet(): Promise<boolean> {
	try {
		const response = await fetch("https://www.gstatic.com/generate_204", {
			method: "POST",
			mode: "no-cors",
		});

		if (response) return true;
		else return false;
	} catch (_) {
		return false;
	}
}

/** A `query()` for auto-deduping */
export const gIsUserConnectedToInternet = query(
	isUserConnectedToInternet,
	QUERY_NAME.IS_CONNECTED,
);

export async function gThrowIfNoInternet(): Promise<void> {
	if (!(await gIsUserConnectedToInternet()))
		throw Error("No connection detected.");
}
