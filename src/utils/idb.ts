import * as idb from "idb-keyval";
import type {
	DictionaryWordIndexeddbKey,
	DictionaryWordIndexeddbValue,
} from "~/types/dictionary";
import type { GlobalSettings } from "~/types/store";

type IdbKeyAndValues = {
	settings: GlobalSettings;

	/** For every cached word and it's source */
	[key: DictionaryWordIndexeddbKey]: DictionaryWordIndexeddbValue;
};

type IdbKeys = keyof IdbKeyAndValues;

async function get<TKey extends IdbKeys>(
	key: TKey,
): Promise<IdbKeyAndValues[TKey] | undefined>;
async function get<TKey extends IdbKeys>(
	...keys: TKey[]
): Promise<ReadonlyArray<IdbKeyAndValues[TKey]> | undefined>;
async function get<TKey extends IdbKeys>(
	...keys: TKey[]
): Promise<
	IdbKeyAndValues[TKey] | ReadonlyArray<IdbKeyAndValues[TKey]> | undefined
> {
	return keys.length > 1
		? idb.getMany(keys)
		: keys[0]
			? idb.get(keys[0])
			: undefined;
}

type IdbKeyAndValueTuple<TKey extends IdbKeys = IdbKeys> = [
	TKey,
	IdbKeyAndValues[TKey],
];

async function set<TKey extends IdbKeys>(
	keyAndValue: IdbKeyAndValueTuple<TKey>,
): Promise<void>;
async function set<TKey extends IdbKeys>(
	...keysAndValues: IdbKeyAndValueTuple<TKey>[]
): Promise<void>;
async function set<TKey extends IdbKeys>(
	...keysAndValues: IdbKeyAndValueTuple<TKey>[]
): Promise<void> {
	return keysAndValues.length > 1
		? idb.setMany(keysAndValues)
		: keysAndValues[0]
			? idb.set(...keysAndValues[0])
			: void 0;
}

async function del<TKey extends IdbKeys>(key: TKey): Promise<void>;
async function del<TKey extends IdbKeys>(...keys: TKey[]): Promise<void>;
async function del<TKey extends IdbKeys>(...keys: TKey[]): Promise<void> {
	return keys.length > 1 ? idb.delMany(keys) : keys[0] ? idb.del(keys) : void 0;
}

type IdbKeyAndUpdaterTuple<TKey extends IdbKeys> = [
	TKey,
	(oldValue: IdbKeyAndValues[TKey] | undefined) => IdbKeyAndValues[TKey],
];

async function update<TKey extends IdbKeys>(
	keyAndUpdater: IdbKeyAndUpdaterTuple<TKey>,
): Promise<void>;
async function update<TKey extends IdbKeys>(
	...keysAndUpdaters: IdbKeyAndUpdaterTuple<TKey>[]
): Promise<void>;
async function update<TKey extends IdbKeys>(
	...keysAndUpdaters: IdbKeyAndUpdaterTuple<TKey>[]
): Promise<void> {
	return keysAndUpdaters.length > 1
		? Promise.all(keysAndUpdaters.map((val) => idb.update(...val))).then(
				(_) => void 0,
			)
		: keysAndUpdaters[0]
			? idb.update(...keysAndUpdaters[0])
			: void 0;
}

async function clear(): Promise<void> {
	return idb.clear();
}

async function entries(): Promise<IdbKeyAndValueTuple[]> {
	return idb.entries();
}

async function keys(): Promise<IdbKeys[]> {
	return idb.keys();
}

async function values(): Promise<IdbKeyAndValues[IdbKeys][]> {
	return idb.values();
}

export { clear, del, entries, get, keys, set, update, values };
