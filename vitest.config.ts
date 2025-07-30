import path from "node:path";
import solid from "vite-plugin-solid";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [solid(), tsconfigPaths()],
	resolve: {
		conditions: ["development", "browser"],
	},
	test: {
		alias: {
			"idb-keyval": path.resolve(
				__dirname,
				"./src/tests/__mocks__/idb-keyval.ts",
			),
		},
	},
});
