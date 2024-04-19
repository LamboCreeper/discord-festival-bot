export class GoogleDriveUtils {
	static getDownloadLink(originalURL: string): string {
		const id = originalURL.split("/")[5];

		return `https://www.googleapis.com/drive/v3/files/${id}?alt=media&key=${process.env.GOOGLE_DRIVE_API_KEY}`;
	}
}
