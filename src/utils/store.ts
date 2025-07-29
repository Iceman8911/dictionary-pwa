import { unwrap } from "solid-js/store";

/** Returns a proxy-less deeply cloned copy of the given store.
 *
 * **MUST NOT HAVE ANY VALUE THANT CANNOT BE CLONED WITH `structuredClone`**
 */
function cloneStore<T extends object>(store: T): T {
	return structuredClone(unwrap(store));
}

export { cloneStore };
