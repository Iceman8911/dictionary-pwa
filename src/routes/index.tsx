import { createAsync } from "@solidjs/router";
import SearchIcon from "lucide-solid/icons/search";
import { createSignal, For, type JSX, Show, Suspense } from "solid-js";
import Placeholder from "~/components/placeholder";
import { getSearchSuggestions } from "~/dictionaries/datamuse";
import { fetchDictionaryResult } from "~/dictionaries/dictionary";
import type { DictionaryWordResult } from "~/types/dictionary";
import { generateUUID } from "~/utils/other";

type NullableDictionaryWordResult = DictionaryWordResult | null;

export default function Home() {
	const [searchResult, setSearchResult] =
		createSignal<NullableDictionaryWordResult>(null);

	const searchWord = async (word: string) => {
		setSearchResult(
			await fetchDictionaryResult({
				word: word,
			}),
		);
	};

	return (
		<div class="grid grid-cols-2 grid-rows-[3rem_3rem_1fr] md:grid-rows-[3rem_1fr] gap-4 h-[85%] px-4">
			<SearchBar searchFunction={searchWord} />

			<SearchResults
				searchResult={searchResult()}
				searchFunction={searchWord}
			/>

			<SearchedWordInfo
				searchResult={searchResult()}
				searchFunction={searchWord}
			/>
		</div>
	);
}

function SearchBar(prop: { searchFunction: (word: string) => Promise<void> }) {
	const DATALIST_ID = generateUUID();

	const [searchInput, setSearchInput] = createSignal("");

	const suggestions = createAsync(() => {
		if (searchInput()) return getSearchSuggestions({ word: searchInput() });

		return Promise.resolve([]);
	});

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
				onKeyUp={({ key }) => {
					if (key === "Enter") prop.searchFunction(searchInput());
				}}
				onChange={(_) => prop.searchFunction(searchInput())}
				list={DATALIST_ID}
			/>

			<datalist id={DATALIST_ID}>
				<Suspense fallback={<Placeholder />}>
					<For each={suggestions.latest} fallback={<Placeholder />}>
						{({ word }) => <option value={word}></option>}
					</For>
				</Suspense>
			</datalist>
		</label>
	);
}

/** A list including the currently searched word and related ones */
function SearchResults(prop: {
	searchResult: NullableDictionaryWordResult;
	searchFunction: (word: string) => Promise<void>;
}) {
	const searchResultList = () =>
		prop.searchResult
			? [prop.searchResult.name, prop.searchResult.related.synonyms].flat()
			: [];

	return (
		<SharedContainer class="col-span-2 md:col-span-1 md:p-4">
			<ul class="menu menu-horizontal md:menu-vertical size-full md:text-lg flex-nowrap overflow-x-auto">
				<For each={searchResultList()} fallback={<Placeholder />}>
					{(word) => (
						<li>
							<button
								type="button"
								class="link link-primary"
								onClick={(_) => prop.searchFunction(word)}
							>
								{word}
							</button>
						</li>
					)}
				</For>
			</ul>
		</SharedContainer>
	);
}

/** Relevant data about the currently searched word */
function SearchedWordInfo(prop: {
	searchResult: NullableDictionaryWordResult;
	searchFunction: (word: string) => Promise<void>;
}) {
	const searchFunc = (word: string) => prop.searchFunction(word);

	function Definitions(prop: {
		definitions: DictionaryWordResult["definitions"];
	}) {
		return (
			<div>
				<Show when={!!prop.definitions.length && prop.definitions}>
					{(definitions) => (
						<>
							<span>Definitions:</span>

							<ul class="mt-1">
								<For each={definitions()}>
									{({ definition, partOfSpeech }, index) => (
										<li>
											<span>{index()}.</span>{" "}
											<span> {`(${partOfSpeech})`}</span> {definition}
										</li>
									)}
								</For>
							</ul>
						</>
					)}
				</Show>
			</div>
		);
	}

	function Examples(prop: { examples: DictionaryWordResult["examples"] }) {
		return (
			<div>
				<Show when={!!prop.examples.length && prop.examples}>
					{(examples) => (
						<>
							<span>Examples:</span>

							<ul class="mt-1">
								<For each={examples()}>
									{({ example, partOfSpeech }, index) => (
										<li>
											<span>{index()}.</span>{" "}
											<span> {`(${partOfSpeech})`}</span> {example}
										</li>
									)}
								</For>
							</ul>
						</>
					)}
				</Show>
			</div>
		);
	}

	function Frequency(prop: { freq: DictionaryWordResult["frequency"] }) {
		return (
			<Show when={prop.freq}>
				{(freq) => (
					<div>
						<span>Frequency In Daily Use:</span> {freq()}
					</div>
				)}
			</Show>
		);
	}

	function Audio(prop: { url: DictionaryWordResult["audioUrl"] }) {
		return (
			<Show when={prop.url}>
				{(audioUrl) => (
					<div>
						<span>Audio Url:</span>{" "}
						<a href={audioUrl().toString()}>{audioUrl().toString()}</a>
					</div>
				)}
			</Show>
		);
	}

	function RelatedWordList(prop: { list: string[]; name: string }) {
		return (
			<Show when={prop.list.length}>
				{(length) => (
					<div>
						<span>{prop.name}: </span>

						<For each={prop.list}>
							{(synonym, index) => (
								<>
									<button
										type="button"
										class="link link-primary"
										onClick={(_) => searchFunc(synonym)}
									>
										{synonym}
									</button>

									<Show when={index() + 1 < length()} fallback={"."}>
										{", "}
									</Show>
								</>
							)}
						</For>
					</div>
				)}
			</Show>
		);
	}

	return (
		<SharedContainer class="col-span-2 md:col-span-1">
			<Show when={prop.searchResult} fallback={<Placeholder />}>
				{(val) => (
					<div class="size-full overflow-y-auto flex flex-col gap-3 p-4 [&_span]:font-semibold">
						<div>
							<span>Name:</span> {val().name}
						</div>

						<div>
							<span>Part Of Speech:</span> {val().partOfSpeech.join(", ")}
						</div>

						<div>
							<span>IPA Phonetics:</span> {val().phonetics}
						</div>

						<Audio url={val().audioUrl} />

						<Definitions definitions={val().definitions} />

						<Examples examples={val().examples} />

						<Frequency freq={val().frequency} />

						<RelatedWordList list={val().related.synonyms} name="Synonyms" />

						<RelatedWordList list={val().related.antonyms} name="Antonyms" />
					</div>
				)}
			</Show>
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
