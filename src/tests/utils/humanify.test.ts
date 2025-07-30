import { describe, expect, it } from "vitest";
import { capitalizeString, prettifyTime } from "./../../utils/humanify";

describe("prettifyTime", () => {
	it("should work on any number of milliseconds", () => {
		expect(prettifyTime(450)).toBe("450 millisecond(s)");

		expect(prettifyTime(1000)).toBe("1 second(s)");

		expect(prettifyTime(1500)).toBe("1.50 second(s)");

		expect(prettifyTime(2000 * 60)).toBe("2 minute(s)");

		expect(prettifyTime(3000 * 60 * 60)).toBe("3 hour(s)");
	});
});

describe("capitalizeString", () => {
	it("should capitalize the first letter of a string", () => {
		expect(capitalizeString("hello")).toBe("Hello");
	});

	it("should return an empty string if input is empty", () => {
		expect(capitalizeString("")).toBe("");
	});

	it("should handle single-letter strings", () => {
		expect(capitalizeString("a")).toBe("A");
	});

	it("should not change strings that are already capitalized", () => {
		expect(capitalizeString("World")).toBe("World");
	});

	it("should not handle multiple words in a string", () => {
		expect(capitalizeString("the dog")).toBe("The Dog");
	});

	it("should handle strings with leading spaces", () => {
		expect(capitalizeString("  test")).toBe("  Test");
	});
});
