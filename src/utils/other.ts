const generateUUID = () => crypto.randomUUID();

function getRandomElementInArray<TElement>(arr: TElement[]): TElement | null {
	return arr[Math.floor((Math.random() * 100) % arr.length)] ?? null;
}

export { generateUUID, getRandomElementInArray };
