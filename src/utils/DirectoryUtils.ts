import { readdir } from "fs";
import { promisify } from "util";

class DirectoryUtils {
	static readDirectory = promisify(readdir);

	private static require = require;

	static async getFilesInDirectory(directory: string, ending: string): Promise<any[]> {
		const directoryContents = await this.readDirectory(directory);

		return directoryContents
			.filter(file => file.endsWith(ending))
			.map(file => this.require(`${directory}/${file}`));
	}

	static appendFileExtension(fileName: string): string {
		const extension = process.env.NODE_ENV !== "production" ? ".ts" : ".js";

		return fileName + extension;
	}
}

export default DirectoryUtils;