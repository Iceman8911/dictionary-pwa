// Based off `https://github.com/Vexcited/Signatures-IUT-Limoges/blob/main/packages/website/scripts/fix-assets-path-build.mjs`

import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * @param {string} filePath
 * @returns {Promise<string>}
 */
function createMD5(filePath) {
	return new Promise((res) => {
		const hash = createHash("md5");

		const rStream = createReadStream(filePath);
		rStream.on("data", (data) => {
			hash.update(data);
		});
		rStream.on("end", () => {
			res(hash.digest("hex"));
		});
	});
}

// Change `"dist/_build/sw.js"` if that's not where the service worker is built into.
const swFilePath = join(process.cwd(), "dist/_build/sw.js");
const fileContent = await readFile(swFilePath, "utf8");
let newFileContent = fileContent.replace("//# sourceMappingURL=sw.js.map", "");

const indexHtmlFilePath = join(process.cwd(), "dist/index.html");
const indexHtmlMD5 = await createMD5(indexHtmlFilePath);

// Optional
console.log("The html's hash is: ", indexHtmlMD5);

newFileContent = newFileContent.replace(
	"REV_INDEX_HTML_TO_CHANGE",
	indexHtmlMD5,
);
await writeFile(swFilePath, newFileContent, "utf8");
