import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchDictionaryResult } from "~/dictionaries/dictionary";
import { DICTIONARY_API } from "~/shared/enums";
import { clear, del, get, keys, set } from "~/tests/__mocks__/idb-keyval"; // Import the mocked functions

// Mock the entire idb-keyval module
vi.mock("idb-keyval");

describe("fetchDictionaryResult", () => {
	// Clear mocks before each test to ensure isolation
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should return an object containing the searched word's name or null", async () => {
		// Make idb.get initially return null, simulating a cache miss
		get.mockResolvedValue(null);

		const WORDS = ["Cheese", "Cold-hearted", "API", "Grilled Cheese"] as const;

		for (const word of WORDS) {
			const result = await fetchDictionaryResult({
				word: word,
			});

			expect(result).not.toBeNull();
			expect(result?.name).toBe(word);
			expect(set).toHaveBeenCalled(); // Ensure data was attempted to be cached
		}
	});

	it("should return cached data if available and not expired", async () => {
		const cachedOn = new Date();
		cachedOn.setHours(cachedOn.getHours() - 1); // 1 hour old, assuming cacheDuration is > 1 hour

		// Mock idb.get to return cached data
		get.mockResolvedValue({
			cachedOn,
			data: {
				audioUrls: [],
				definitions: [],
				examples: [],
				frequency: null,
				name: "CachedWord",
				originApi: DICTIONARY_API.FREE_DICTIONARY,
				partsOfSpeech: [],
				phonetics: [],
				related: { antonyms: [], synonyms: [] },
			},
		});

		// Mock Date.now() if your `isCachedEntryExpired` depends on precise timing
		// For simplicity, let's assume `gSettings.cacheDuration` is set to something like 2 hours
		// or mock gSettings for the test if needed.
		// E.g., gSettings.cacheDuration = 60 * 60 * 1000 * 2; // 2 hours

		const result = await fetchDictionaryResult({
			dictionary: DICTIONARY_API.FREE_DICTIONARY,
			word: "CachedWord",
		});

		expect(result).not.toBeNull();
		expect(result?.name).toBe("CachedWord");
		expect(set).not.toHaveBeenCalled(); // No new data to set
	});
});
