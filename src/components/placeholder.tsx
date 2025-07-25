export default function Placeholder() {
	const flavourText = [
		"Nothing :(",
		"The void consumes all.",
		"Guess the search query didn't work :/",
		"Datamuse is peak, fr.",
		"Try searching for something!",
		"Did you type in an actual word?",
		"Hope this dictionary proves useful for you :3",
		"^w^",
		"All your search results are cached so they'll even work offline!",
		"TODO:",
		"Could probably cache more...",
	] as const;

	return flavourText[Math.floor((Math.random() * 100) % flavourText.length)];
}
