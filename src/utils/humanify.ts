/** To make viewing elapsed time and similar easier to read */
function prettifyTime(
	timeInMilliseconds: number,
):
	| `${number} milliseconds`
	| `${string} seconds`
	| `${string} minutes`
	| `${string} hours`
	| `${string} days`
	| `${string} weeks`
	| `${string} months`
	| `${string} years` {
	const TO_SECONDS = 1000,
		TO_MINUTES = TO_SECONDS * 60,
		TO_HOURS = TO_MINUTES * 60,
		TO_DAYS = TO_HOURS * 24,
		TO_WEEKS = TO_DAYS * 7,
		TO_MONTHS = TO_WEEKS * 4,
		TO_YEARS = TO_MONTHS * 12;

	if (timeInMilliseconds < TO_SECONDS)
		return `${timeInMilliseconds} milliseconds`;

	if (timeInMilliseconds < TO_MINUTES)
		return `${(timeInMilliseconds / TO_SECONDS).toFixed(2)} seconds`;

	if (timeInMilliseconds < TO_HOURS)
		return `${(timeInMilliseconds / TO_MINUTES).toFixed(2)} minutes`;

	if (timeInMilliseconds < TO_DAYS)
		return `${(timeInMilliseconds / TO_HOURS).toFixed(2)} hours`;

	if (timeInMilliseconds < TO_WEEKS)
		return `${(timeInMilliseconds / TO_DAYS).toFixed(2)} days`;

	if (timeInMilliseconds < TO_MONTHS)
		return `${(timeInMilliseconds / TO_WEEKS).toFixed(2)} weeks`;

	if (timeInMilliseconds < TO_YEARS)
		return `${(timeInMilliseconds / TO_MONTHS).toFixed(2)} months`;

	return `${(timeInMilliseconds / TO_YEARS).toFixed(2)} years`;
}

export { prettifyTime };
