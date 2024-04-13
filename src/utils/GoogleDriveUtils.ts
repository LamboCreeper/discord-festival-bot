export class GoogleDriveUtils {
	static getDownloadLink(originalURL: string): string {
		const id = originalURL.split("/")[5];

		return `https://drive.google.com/uc?export=download&id=${id}`;
	}
}
