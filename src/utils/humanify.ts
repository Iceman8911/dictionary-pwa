/** To make viewing elapsed time and similar easier to read */
function prettifyTime(
	timeInMilliseconds: number,
):
	| `${number} millisecond(s)`
	| `${string} second(s)`
	| `${string} minute(s)`
	| `${string} hour(s)`
	| `${string} day(s)`
	| `${string} week(s)`
	| `${string} month(s)`
	| `${string} year(s)` {
	const TO_SECONDS = 1000,
		TO_MINUTES = TO_SECONDS * 60,
		TO_HOURS = TO_MINUTES * 60,
		TO_DAYS = TO_HOURS * 24,
		TO_WEEKS = TO_DAYS * 7,
		TO_MONTHS = TO_WEEKS * 4,
		TO_YEARS = TO_MONTHS * 12;

	if (timeInMilliseconds < TO_SECONDS)
		return `${timeInMilliseconds} millisecond(s)`;

	if (timeInMilliseconds < TO_MINUTES) {
		const minutes = timeInMilliseconds / TO_SECONDS;

		return timeInMilliseconds % TO_SECONDS === 0
			? `${minutes} second(s)`
			: `${minutes.toFixed(2)} second(s)`;
	}

	if (timeInMilliseconds < TO_HOURS) {
		const minutes = timeInMilliseconds / TO_MINUTES;

		return timeInMilliseconds % TO_MINUTES === 0
			? `${minutes} minute(s)`
			: `${minutes.toFixed(2)} minute(s)`;
	}

	if (timeInMilliseconds < TO_DAYS) {
		const hours = timeInMilliseconds / TO_HOURS;

		return timeInMilliseconds % TO_HOURS === 0
			? `${hours} hour(s)`
			: `${hours.toFixed(2)} hour(s)`;
	}

	if (timeInMilliseconds < TO_WEEKS) {
		const days = timeInMilliseconds / TO_DAYS;

		return timeInMilliseconds % TO_DAYS === 0
			? `${days} day(s)`
			: `${days.toFixed(2)} day(s)`;
	}

	if (timeInMilliseconds < TO_MONTHS) {
		const weeks = timeInMilliseconds / TO_WEEKS;

		return timeInMilliseconds % TO_WEEKS === 0
			? `${weeks} week(s)`
			: `${weeks.toFixed(2)} week(s)`;
	}

	if (timeInMilliseconds < TO_YEARS) {
		const months = timeInMilliseconds / TO_MONTHS;

		return timeInMilliseconds % TO_MONTHS === 0
			? `${months} month(s)`
			: `${months.toFixed(2)} month(s)`;
	}

	const years = timeInMilliseconds / TO_YEARS;
	return timeInMilliseconds % TO_YEARS === 0
		? `${years} year(s)`
		: `${years.toFixed(2)} year(s)`;
}

function capitalizeString(string: string): string {
	const words = string.split(" ");

	const capitalize = (str: string) => {
		return (str[0] ?? "").toLocaleUpperCase() + str.slice(1);
	};

	return words.map((word) => capitalize(word)).join(" ");
}

export { prettifyTime, capitalizeString };
