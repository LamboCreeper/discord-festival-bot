import { injectable as Injectable, inject as Inject } from "tsyringe";
import { firestore as fs } from "../app";
import IFestival from "../interfaces/IFestival";

@Injectable()
export default class FestivalRepository {
	private static readonly COLLECTION = "festivals";

	constructor(
		@Inject("Firestore")
		private readonly firestore: typeof fs
	) {}

	async createFestival(data: IFestival): Promise<void> {
		await this.firestore.collection(FestivalRepository.COLLECTION).add(data);
	}
}
