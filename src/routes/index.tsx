import {
	type AccessorWithLatest,
	createAsync,
	useSearchParams,
} from "@solidjs/router";
import SearchIcon from "lucide-solid/icons/search";
import {
	createMemo,
	createSignal,
	For,
	Index,
	type JSXElement,
	onCleanup,
	type Setter,
	Show,
	Suspense,
} from "solid-js";
import LoadingSpinner from "~/components/loading-spinner";
import Placeholder from "~/components/placeholder";
import {
	fetchDictionaryResult,
	getNameOfDictionaryApi,
	getSearchSuggestions,
} from "~/dictionaries/dictionary";
import { DICTIONARY_API } from "~/shared/enums";
import { gSettings } from "~/shared/store";
import type { DictionaryWordResult } from "~/types/dictionary";
import { capitalizeString } from "~/utils/humanify";

type DictionaryResultCollection = Map<DICTIONARY_API, DictionaryWordResult>;

type SearchParams = {
	query?: string;
};

const SEARCH_MIN_LENGTH = 2;
const SUGGESTION_PLACEHOLDER_TEXT = {
	LOADING: "Loading...",
	NO_INPUT: "No input...",
	NO_SUGGESTIONS: "No suggestions available",
} as const;

export default function Home() {
	const [searchInput, setSearchInput] = createSignal("");
	const [isFetchingData, setIsFetchingData] = createSignal(false);
	const [searchParams, setSearchParams] = useSearchParams<SearchParams>();

	const searchWord = (word: string) => {
		setSearchParams({ query: word });
		setIsFetchingData(true);
	};

	const searchResults: AccessorWithLatest<DictionaryResultCollection> =
		createAsync(
			async () => {
				if (!searchParams.query) {
					setIsFetchingData(false);
					return new Map();
				}

				const results = await Promise.allSettled(
					[...gSettings.dictionaries].map((dictionary) =>
						fetchDictionaryResult({
							word: searchParams.query ?? "",
							dictionary,
						}),
					),
				);

				const resultMap = results.reduce<DictionaryResultCollection>(
					(acc, result) => {
						if (result.status === "fulfilled" && result.value) {
							acc.set(result.value.originApi, result.value);
						}
						return acc;
					},
					new Map(),
				);

				setIsFetchingData(false);
				return resultMap;
			},
			{ initialValue: new Map() },
		);

	const gridClasses = createMemo(() => {
		const baseClasses =
			"grid h-[85%] grid-cols-2 grid-rows-[3rem_3rem_1fr] gap-4 px-4 pb-4 md:grid-rows-[3rem_1fr]";
		const flipClasses =
			gSettings.searchBarPos === "bottom" ? "-scale-y-100 *:-scale-y-100" : "";
		return `${baseClasses} ${flipClasses}`;
	});

	return (
		<div class={gridClasses()}>
			<SearchBar
				searchFunction={searchWord}
				searchInput={searchInput()}
				setSearchInput={setSearchInput}
			/>

			<SearchResults
				searchResults={searchResults()}
				searchFunction={searchWord}
				setSearchInput={setSearchInput}
				isFetchingData={isFetchingData()}
			/>

			<SearchedWordInfo
				searchResults={searchResults()}
				searchFunction={searchWord}
				setSearchInput={setSearchInput}
				isFetchingData={isFetchingData()}
			/>
		</div>
	);
}

type SearchBarProps = {
	searchFunction: (word: string) => void;
	searchInput: string;
	setSearchInput: Setter<string>;
};

function SearchBar(props: SearchBarProps) {
	const [showSuggestions, setShowSuggestions] = createSignal(false);
	const [searchParams] = useSearchParams<SearchParams>();

	const suggestions = createAsync(
		async () => {
			if (props.searchInput.length > SEARCH_MIN_LENGTH) {
				return getSearchSuggestions(props.searchInput);
			}
			return [];
		},
		{ initialValue: [] },
	);

	const executeSearch = async () => {
		const trimmedInput = props.searchInput.trim();
		props.setSearchInput(trimmedInput);
		props.searchFunction(trimmedInput);
	};

	const handleSuggestionClick = async (word: string) => {
		setShowSuggestions(false);
		props.setSearchInput(word);
		props.searchFunction(word);
	};

	const handleKeyUp = async (key: string) => {
		setShowSuggestions(true);
		if (key === "Enter") {
			setShowSuggestions(false);
			await executeSearch();
		}
	};

	const dropdownClasses = createMemo(() => {
		const baseClasses =
			"dropdown z-1 col-span-2 w-4/5 self-center justify-self-center md:w-3/5";
		const positionClass =
			gSettings.searchBarPos === "bottom" ? "dropdown-top" : "";
		return `${baseClasses} ${positionClass}`;
	});

	return (
		<details
			class={dropdownClasses()}
			open={showSuggestions()}
			ref={(ref) => {
				const handleClickOutside = (event: MouseEvent) => {
					if (!ref.contains(event.target as Node)) {
						setShowSuggestions(false);
					}
				};

				document.addEventListener("click", handleClickOutside);
				onCleanup(() => {
					document.removeEventListener("click", handleClickOutside);
				});
			}}
		>
			<summary class="list-none">
				<label class="input input-primary w-full">
					<SearchIcon
						class="btn btn-primary btn-circle btn-soft h-7/10 w-auto p-0.5"
						strokeWidth={1.5}
						onClick={executeSearch}
					/>

					<input
						type="search"
						placeholder="Search for anything..."
						value={searchParams.query ?? props.searchInput}
						onInput={({ target: { value } }) => {
							setShowSuggestions(true);
							props.setSearchInput(value);
						}}
						onKeyUp={({ key }) => handleKeyUp(key)}
						onPointerUp={() => setShowSuggestions(true)}
					/>
				</label>
			</summary>

			<SuggestionsDropdown
				searchInput={props.searchInput}
				suggestions={[...suggestions.latest]}
				onSuggestionClick={handleSuggestionClick}
			/>
		</details>
	);
}

type SuggestionsDropdownProps = {
	searchInput: string;
	suggestions: string[];
	onSuggestionClick: (word: string) => void;
};

function SuggestionsDropdown(props: SuggestionsDropdownProps) {
	const FallbackMessage = (message: string) => (
		<li class="italic">
			<div>{message}</div>
		</li>
	);

	return (
		<ul class="menu dropdown-content z-1 mt-1 w-full rounded-box border border-primary bg-base-100 p-2 shadow-sm">
			<Suspense fallback={FallbackMessage(SUGGESTION_PLACEHOLDER_TEXT.LOADING)}>
				<Show
					when={props.searchInput}
					fallback={FallbackMessage(SUGGESTION_PLACEHOLDER_TEXT.NO_INPUT)}
				>
					<Index
						each={props.suggestions}
						fallback={FallbackMessage(
							SUGGESTION_PLACEHOLDER_TEXT.NO_SUGGESTIONS,
						)}
					>
						{(word) => (
							<li>
								<button
									type="button"
									onClick={() => props.onSuggestionClick(word())}
								>
									{word()}
								</button>
							</li>
						)}
					</Index>
				</Show>
			</Suspense>
		</ul>
	);
}

type SearchResultsProps = {
	searchResults: DictionaryResultCollection;
	searchFunction: (word: string) => void;
	setSearchInput: Setter<string>;
	isFetchingData: boolean;
};

function SearchResults(props: SearchResultsProps) {
	const wordList = createMemo(() => {
		if (!props.searchResults.size) return [];

		const allWords = [...props.searchResults.values()]
			.filter(Boolean)
			.flatMap((result) => [result.name, ...result.related.synonyms]);

		return [...new Set(allWords)];
	});

	const handleWordClick = (word: string) => {
		props.searchFunction(word);
		props.setSearchInput(word);
	};

	return (
		<Container class="col-span-2 md:col-span-1 md:p-4">
			<Show when={props.isFetchingData}>
				<LoadingSpinner />
			</Show>

			<ul class="menu menu-horizontal md:menu-vertical size-full flex-nowrap overflow-x-auto md:text-lg">
				<Suspense>
					<For each={wordList()} fallback={<Placeholder />}>
						{(word, index) => (
							<li>
								<button
									type="button"
									class={`link ${index() === 0 ? "link-primary" : ""}`}
									onClick={() => handleWordClick(word)}
								>
									{capitalizeString(word)}
								</button>
							</li>
						)}
					</For>
				</Suspense>
			</ul>
		</Container>
	);
}

type SearchedWordInfoProps = {
	searchResults: DictionaryResultCollection;
	searchFunction: (word: string) => void;
	setSearchInput: Setter<string>;
	isFetchingData: boolean;
};

function SearchedWordInfo(props: SearchedWordInfoProps) {
	const [selectedApiSource, setSelectedApiSource] =
		createSignal<DICTIONARY_API | null>(null);

	const defaultApiSource = () => [...props.searchResults.keys()][0] ?? null;

	const currentApiSource = createMemo(
		() => selectedApiSource() ?? defaultApiSource(),
	);

	const currentResult = createMemo(() => {
		const source = currentApiSource();
		if (!source) return null;

		return (
			props.searchResults.get(source) ??
			props.searchResults.get(defaultApiSource() ?? DICTIONARY_API.DATAMUSE)
		);
	});

	const handleWordClick = (word: string) => {
		props.searchFunction(word);
		props.setSearchInput(word);
	};

	return (
		<Container class="col-span-2 md:col-span-1">
			<Show when={props.isFetchingData}>
				<LoadingSpinner />
			</Show>

			<Suspense>
				<Show when={currentResult()} fallback={<Placeholder />}>
					{(result) => (
						<div class="flex size-full flex-col gap-3 overflow-y-auto p-4 [&_span]:font-semibold">
							<SourceInfo
								currentApi={result().originApi}
								allResults={props.searchResults}
								currentApiSource={currentApiSource()}
								onSourceChange={setSelectedApiSource}
							/>

							<WordBasicInfo result={result()} />

							<AudioSection urls={result().audioUrls} />

							<DefinitionsSection definitions={result().definitions} />

							<ExamplesSection
								examples={result().examples}
								word={result().name}
							/>

							<FrequencySection frequency={result().frequency} />

							<RelatedWordsSection
								synonyms={result().related.synonyms}
								antonyms={result().related.antonyms}
								onWordClick={handleWordClick}
							/>
						</div>
					)}
				</Show>
			</Suspense>
		</Container>
	);
}

type SourceInfoProps = {
	currentApi: DICTIONARY_API;
	allResults: DictionaryResultCollection;
	currentApiSource: DICTIONARY_API | null;
	onSourceChange: (api: DICTIONARY_API) => void;
};

function SourceInfo(props: SourceInfoProps) {
	const otherSources = createMemo(() =>
		[...props.allResults.entries()].filter(
			([api, result]) => api !== props.currentApiSource && result,
		),
	);

	return (
		<>
			<div>
				<span>Sourced From:</span>{" "}
				<span class="text-primary">
					{getNameOfDictionaryApi(props.currentApi)}
				</span>
			</div>

			<Show when={otherSources().length > 0}>
				<div>
					<span>Other Sources:</span>{" "}
					<For each={otherSources()}>
						{([api], index) => (
							<>
								<button
									type="button"
									class="link link-primary"
									onClick={() => props.onSourceChange(api)}
								>
									{getNameOfDictionaryApi(api)}
								</button>
								<Show when={index() + 1 < otherSources().length} fallback={"."}>
									{", "}
								</Show>
							</>
						)}
					</For>
				</div>
			</Show>
		</>
	);
}

function WordBasicInfo(props: { result: DictionaryWordResult }) {
	return (
		<>
			<div>
				<span>Name:</span>{" "}
				<span class="text-primary">{capitalizeString(props.result.name)}</span>
			</div>

			<Show when={props.result.partsOfSpeech.length > 0}>
				<div>
					<span>Part Of Speech:</span> {props.result.partsOfSpeech.join(", ")}
				</div>
			</Show>

			<Show when={props.result.phonetics.length > 0}>
				<div>
					<span>IPA Phonetics:</span>{" "}
					<For each={props.result.phonetics}>
						{(phonetic, index) => (
							<>
								{phonetic}
								<Show
									when={index() + 1 < props.result.phonetics.length}
									fallback={"."}
								>
									{", "}
								</Show>
							</>
						)}
					</For>
				</div>
			</Show>
		</>
	);
}

function AudioSection(props: { urls: string[] }) {
	return (
		<Show when={props.urls.length > 0}>
			<div class="flex flex-wrap gap-2">
				<span>Audio:</span>
				<For each={props.urls}>
					{(url) => (
						<audio class="inline-block" controls preload="none" src={url}>
							<track kind="captions" />
						</audio>
					)}
				</For>
			</div>
		</Show>
	);
}

function DefinitionsSection(props: {
	definitions: DictionaryWordResult["definitions"];
}) {
	return (
		<Show when={props.definitions.length > 0}>
			<div>
				<span>Definitions:</span>
				<ul class="mt-1 flex flex-col gap-1">
					<For each={props.definitions}>
						{({ definition, partOfSpeech }, index) => (
							<li>
								<span>{index() + 1}.</span>
								<Show when={partOfSpeech}>
									<span> ({partOfSpeech}) </span>
								</Show>
								{definition}
							</li>
						)}
					</For>
				</ul>
			</div>
		</Show>
	);
}

function ExamplesSection(props: {
	examples: DictionaryWordResult["examples"];
	word: string;
}) {
	return (
		<Show when={props.examples.length > 0}>
			<div>
				<span>Examples:</span>
				<ul class="mt-1 flex flex-col gap-1">
					<For each={props.examples}>
						{({ example, partOfSpeech }, index) => {
							const parts = example.split(props.word);

							return (
								<li>
									<span>{index() + 1}.</span>
									<Show when={partOfSpeech}>
										<span> ({partOfSpeech}) </span>
									</Show>
									<For each={parts}>
										{(part, i) => (
											<>
												{part}
												<Show when={i() < parts.length - 1}>
													<span class="text-info">{props.word}</span>
												</Show>
											</>
										)}
									</For>
								</li>
							);
						}}
					</For>
				</ul>
			</div>
		</Show>
	);
}

function FrequencySection(props: {
	frequency: DictionaryWordResult["frequency"];
}) {
	return (
		<Show when={props.frequency}>
			{(freq) => (
				<div>
					<span>Frequency In Daily Use:</span> {freq()}
				</div>
			)}
		</Show>
	);
}

function RelatedWordsSection(props: {
	synonyms: string[];
	antonyms: string[];
	onWordClick: (word: string) => void;
}) {
	const renderWordList = (words: string[], title: string) => (
		<Show when={words.length > 0}>
			<div>
				<span>{title}:</span>{" "}
				<For each={words}>
					{(word, index) => (
						<>
							<button
								type="button"
								class="link link-primary"
								onClick={() => props.onWordClick(word)}
							>
								{word}
							</button>
							<Show when={index() + 1 < words.length} fallback={"."}>
								{", "}
							</Show>
						</>
					)}
				</For>
			</div>
		</Show>
	);

	return (
		<>
			{renderWordList(props.synonyms, "Synonyms")}
			{renderWordList(props.antonyms, "Antonyms")}
		</>
	);
}

function Container(props: { class?: string; children: JSXElement }) {
	return (
		<div
			class={`relative flex items-center justify-center overflow-hidden rounded-box bg-base-200 ${props.class ?? ""}`}
		>
			{props.children}
		</div>
	);
}
