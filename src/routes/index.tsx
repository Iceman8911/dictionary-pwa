import { createAsync } from "@solidjs/router";
import SearchIcon from "lucide-solid/icons/search";
import {
	createMemo,
	createSignal,
	For,
	type JSX,
	type Setter,
	Show,
	Suspense,
} from "solid-js";
import Placeholder from "~/components/placeholder";
import { getSearchSuggestions } from "~/dictionaries/datamuse";
import {
	fetchDictionaryResult,
	getNameOfDictionaryApi,
} from "~/dictionaries/dictionary";
import { DICTIONARY_API } from "~/shared/enums";
import { gSettings } from "~/shared/store";
import type { DictionaryWordResult } from "~/types/dictionary";
import { capitalizeString } from "~/utils/humanify";
import { generateUUID } from "~/utils/other";

type DictionaryWordResultCollection = Map<DICTIONARY_API, DictionaryWordResult>;

export default function Home() {
	const [searchResults, setSearchResults] =
		createSignal<DictionaryWordResultCollection>(new Map());

	const [searchInput, setSearchInput] = createSignal("");

	const searchWord = async (word: string) => {
		setSearchResults(
			(
				await Promise.allSettled(
					[...gSettings.dictionaries].map((dictionary) =>
						fetchDictionaryResult({
							word: word,
							dictionary,
						}),
					),
				)
			).reduce<DictionaryWordResultCollection>((acc, val) => {
				if (val.status === "fulfilled" && val.value) {
					acc.set(val.value.originApi, val.value);
				}

				return acc;
			}, new Map()),
		);
	};

	return (
		<div class="grid grid-cols-2 grid-rows-[3rem_3rem_1fr] md:grid-rows-[3rem_1fr] gap-4 h-[85%] px-4 pb-4">
			<SearchBar
				searchFunction={searchWord}
				searchInput={searchInput()}
				searchInputSetter={setSearchInput}
			/>

			<SearchResults
				searchResult={searchResults()}
				searchFunction={searchWord}
				searchInputSetter={setSearchInput}
			/>

			<SearchedWordInfo
				searchResult={searchResults()}
				searchFunction={searchWord}
				searchInputSetter={setSearchInput}
			/>
		</div>
	);
}

function SearchBar(prop: {
	searchFunction: (word: string) => Promise<void>;
	searchInput: string;
	searchInputSetter: Setter<string>;
}) {
	const DATALIST_ID = generateUUID();

	const suggestions = createAsync(() => {
		if (prop.searchInput.length > 2)
			return getSearchSuggestions({ word: prop.searchInput });

		return Promise.resolve([]);
	});

	const cleanInputAndSearch = () => {
		prop.searchInputSetter((oldVal) => oldVal.trim());

		prop.searchFunction(prop.searchInput);
	};

	return (
		<label class="input input-primary col-span-2 justify-self-center self-center w-4/5 md:w-3/5">
			<SearchIcon class="h-[75%] w-auto text-primary" strokeWidth={1} />

			<input
				type="search"
				placeholder="Search for anything..."
				value={prop.searchInput}
				onInput={({ target: { value } }) => {
					prop.searchInputSetter(value);
				}}
				onKeyUp={({ key }) => {
					if (key === "Enter") cleanInputAndSearch();
				}}
				onChange={cleanInputAndSearch}
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
	searchResult: DictionaryWordResultCollection;
	searchFunction: (word: string) => Promise<void>;
	searchInputSetter: Setter<string>;
}) {
	const searchResultList = createMemo(() =>
		prop.searchResult.size
			? [
					...new Set(
						[...prop.searchResult.values()]
							.map((res) => (res ? [res.name, res.related.synonyms] : []))
							.flat(2),
					),
				]
			: [],
	);

	return (
		<SharedContainer class="col-span-2 md:col-span-1 md:p-4">
			<ul class="menu menu-horizontal md:menu-vertical size-full md:text-lg flex-nowrap overflow-x-auto">
				<For each={searchResultList()} fallback={<Placeholder />}>
					{(word, index) => (
						<li>
							<button
								type="button"
								class={`link ${index() === 0 ? "link-primary" : ""}`}
								onClick={(_) =>
									prop
										.searchFunction(word)
										.then((_) => prop.searchInputSetter(word))
								}
							>
								{capitalizeString(word)}
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
	searchResult: DictionaryWordResultCollection;
	searchFunction: (word: string) => Promise<void>;
	searchInputSetter: Setter<string>;
}) {
	const searchFunc = (word: string) =>
		prop.searchFunction(word).then((_) => prop.searchInputSetter(word));

	function Definitions(prop: {
		definitions: DictionaryWordResult["definitions"];
	}) {
		return (
			<div>
				<Show when={!!prop.definitions.length && prop.definitions}>
					{(definitions) => (
						<>
							<span>Definitions:</span>

							<ul class="mt-1 flex flex-col gap-1">
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

	function Examples(prop: {
		examples: DictionaryWordResult["examples"];
		word: string;
	}) {
		return (
			<div>
				<Show when={!!prop.examples.length && prop.examples}>
					{(examples) => (
						<>
							<span>Examples:</span>

							<ul class="mt-1  flex flex-col gap-1">
								<For each={examples()}>
									{({ example, partOfSpeech }, index) => {
										// Highlight the specific word in the example, but extracting it from the string and acdding the word manually
										const splitExample = example.split(prop.word);

										return (
											<li>
												<span>{index()}.</span>{" "}
												<span> {`(${partOfSpeech})`}</span>{" "}
												<For each={splitExample}>
													{(fragment, index) => (
														<>
															{fragment}

															<Show when={index() + 1 < splitExample.length}>
																<span class="text-info">{prop.word}</span>
															</Show>
														</>
													)}
												</For>
											</li>
										);
									}}
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
						<span>Audio:</span>{" "}
						<audio
							class="inline-block"
							controls
							preload="none"
							src={audioUrl()}
						>
							<track kind="captions"></track>
						</audio>
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

	/** The default dictionary result source freshly fetched from the api */
	const apiResultSourceFromSearchResults = () =>
		[...prop.searchResult.keys()][0] ?? null;

	/** The dictionary result source that the user explicitly chooses by clicking on */
	const [apiResultSourceFromUserChoice, setApiResultFromUserChoice] =
		createSignal<DICTIONARY_API | null>(null);

	/** The dictionary result source to actually use, with priority given to the user's choice */
	const apiResultSourceToView = createMemo(
		() => apiResultSourceFromUserChoice() ?? apiResultSourceFromSearchResults(),
	);

	/** Actual data to use for displaying with a backup incase of edge cases */
	const apiResultToView = createMemo(
		() =>
			prop.searchResult.get(
				apiResultSourceToView() ?? DICTIONARY_API.DATAMUSE,
			) ??
			prop.searchResult.get(
				apiResultSourceFromSearchResults() ?? DICTIONARY_API.DATAMUSE,
			),
	);

	return (
		<SharedContainer class="col-span-2 md:col-span-1">
			<Show when={apiResultToView()} fallback={<Placeholder />}>
				{(val) => (
					<div class="size-full overflow-y-auto flex flex-col gap-3 p-4 [&_span]:font-semibold">
						<div>
							<span>Sourced From:</span>{" "}
							<span class="text-primary">
								{getNameOfDictionaryApi(val().originApi)}
							</span>
						</div>

						<Show when={prop.searchResult.size > 1}>
							<div>
								<span>Other Sources:</span>{" "}
								<For each={[...prop.searchResult]}>
									{(res) => (
										<Show when={res[0] !== apiResultSourceToView() && res[1]}>
											{(res) => (
												<button
													type="button"
													class="link link-primary"
													onClick={(_) =>
														setApiResultFromUserChoice(res().originApi)
													}
												>
													{getNameOfDictionaryApi(res().originApi)}
												</button>
											)}
										</Show>
									)}
								</For>
							</div>
						</Show>

						<div>
							<span>Name:</span>{" "}
							<span class="text-primary">{capitalizeString(val().name)}</span>
						</div>

						<div>
							<span>Part Of Speech:</span> {val().partOfSpeech.join(", ")}
						</div>

						<div>
							<span>IPA Phonetics:</span> {val().phonetics}
						</div>

						<Audio url={val().audioUrl} />

						<Definitions definitions={val().definitions} />

						<Examples examples={val().examples} word={val().name} />

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
