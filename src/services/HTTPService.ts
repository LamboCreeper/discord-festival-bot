import { injectable as Injectable } from "tsyringe";
import axios from "axios";

enum HTTPMethod {
	GET = "GET"
}

interface IHTTPRequestOptions {
	responseType?: "text" | "json" | "stream";
}

@Injectable()
export class HTTPService {
	private client = axios.create();

	private async makeRequest<T>(method: HTTPMethod, url: string, options?: IHTTPRequestOptions): Promise<T> {
		const { data } = await this.client.request<T>({
			method,
			url,
			responseType: options?.responseType
		});

		return data;
	}

	async get<T>(url: string, options?: IHTTPRequestOptions): Promise<T> {
		return this.makeRequest<T>(HTTPMethod.GET, url, options);
	}
}
