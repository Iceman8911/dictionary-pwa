import { createAsync } from "@solidjs/router";
import SearchIcon from "lucide-solid/icons/search";
import {
	createSignal,
	For,
	type JSX,
	type Setter,
	Show,
	Suspense,
} from "solid-js";
import type { SetStoreFunction } from "solid-js/store";
import { getSearchSuggestions } from "~/dictionaries/datamuse";
import { fetchDictionaryResult } from "~/dictionaries/dictionary";
import type { DictionaryWordResult } from "~/types/dictionary";
import { generateUUID } from "~/utils/other";

type NullableDictionaryWordResult = DictionaryWordResult | null;

export default function Home() {
	const [searchResult, setSearchResult] =
		createSignal<NullableDictionaryWordResult>(null);

	return (
		<div class="grid grid-cols-2 grid-rows-[3rem_3rem_1fr] md:grid-rows-[3rem_1fr] gap-4 h-[75%] px-4">
			<SearchBar searchResultSetter={setSearchResult} />

			<SearchResults searchResult={searchResult()} />

			<SearchedWordInfo searchResult={searchResult()} />
		</div>
	);
}

function SearchBar(prop: {
	searchResultSetter: Setter<NullableDictionaryWordResult>;
}) {
	const DATALIST_ID = generateUUID();

	const [searchInput, setSearchInput] = createSignal("");

	const suggestions = createAsync(() => {
		if (searchInput()) return getSearchSuggestions({ word: searchInput() });

		return Promise.resolve([]);
	});

	const search = async () => {
		prop.searchResultSetter(
			await fetchDictionaryResult({
				word: searchInput(),
			}),
		);
	};

	return (
		<label class="input input-primary col-span-2 justify-self-center self-center w-4/5 md:w-3/5">
			<SearchIcon class="h-[75%] w-auto text-primary" strokeWidth={1} />

			<input
				type="search"
				placeholder="Search for anything..."
				onInput={({ target: { value } }) => {
					if (value.length > 2) {
						setSearchInput(value);
					} else {
						setSearchInput("");
					}
				}}
				onKeyUp={async ({ key }) => {
					if (key === "Enter") search();
				}}
				onChange={search}
				list={DATALIST_ID}
			/>

			<datalist id={DATALIST_ID}>
				<Suspense>
					<For each={suggestions.latest}>
						{({ word }) => <option value={word}></option>}
					</For>
				</Suspense>
			</datalist>
		</label>
	);
}

/** A list including the currently searched word and related ones */
function SearchResults(prop: { searchResult: NullableDictionaryWordResult }) {
	const searchResultList = () =>
		prop.searchResult
			? [prop.searchResult.name, prop.searchResult.related.synonyms].flat()
			: [];

	return (
		<SharedContainer class="col-span-2 md:col-span-1 md:p-4">
			<ul class="menu menu-horizontal md:menu-vertical size-full md:text-lg flex-nowrap overflow-x-auto">
				<For each={searchResultList()}>
					{(word) => (
						<li>
							<button type="button">{word}</button>
						</li>
					)}
				</For>
			</ul>
		</SharedContainer>
	);
}

/** Relevant data about the currently searched word */
function SearchedWordInfo() {
	return (
		<SharedContainer class="col-span-2 md:col-span-1">
			Word Info
		</SharedContainer>
	);
}

function SharedContainer(prop: { class?: string; children: JSX.Element }) {
	return (
		<div
			class={`bg-base-200 rounded-box flex justify-center items-center overflow-hidden ${prop.class}`}
		>
			{prop.children}
		</div>
	);
}
