import { createAsync } from "@solidjs/router";
import SearchIcon from "lucide-solid/icons/search";
import { createSignal, For, type JSX, Suspense } from "solid-js";
import { createStore, type SetStoreFunction } from "solid-js/store";
import {
	getSearchSuggestions,
	searchForWordDefinitionAndSynonyms,
	type WordSearchResponseOutput,
} from "~/dictionaries/datamuse";
import { generateUUID } from "~/utils/other";

export default function Home() {
	const [searchResults, setSearchResults] =
		createStore<WordSearchResponseOutput>([]);

	return (
		<div class="grid grid-cols-2 grid-rows-[3rem_3rem_1fr] md:grid-rows-[3rem_1fr] gap-4 h-[75%] px-4">
			<SearchBar searchResultSetter={setSearchResults} />

			<SearchResults />

			<SearchedWordInfo />
		</div>
	);
}

function SearchBar(prop: {
	searchResultSetter: SetStoreFunction<WordSearchResponseOutput>;
}) {
	const DATALIST_ID = generateUUID();

	const [searchInput, setSearchInput] = createSignal("");

	const suggestions = createAsync(() => {
		if (searchInput()) return getSearchSuggestions({ hint: searchInput() });

		return Promise.resolve([]);
	});

	return (
		<label class="input input-primary col-span-2 justify-self-center self-center w-4/5 md:w-3/5">
			<SearchIcon class="h-[75%] w-auto text-primary" strokeWidth={1} />

			<input
				type="search"
				placeholder="Search for anything..."
				onInput={({ target: { value } }) => setSearchInput(value)}
				onKeyUp={async ({ key }) => {
					if (key === "Enter") {
						console.log(
							await searchForWordDefinitionAndSynonyms({ word: searchInput() }),
						);
					}
				}}
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
function SearchResults() {
	return (
		<SharedContainer class="col-span-2 md:col-span-1 md:p-4">
			<ul class="menu menu-horizontal md:menu-vertical size-full md:text-lg flex-nowrap overflow-x-auto">
				<For each={Array(35)}>
					{(val) => (
						<li>
							<button type="button">Search Results</button>
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
