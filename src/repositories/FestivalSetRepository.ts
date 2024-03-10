import { injectable as Injectable, inject as Inject } from "tsyringe";
import { firestore as fs } from "../app";
import type { DocumentSnapshot } from "firebase-admin/firestore";

@Injectable()
export default class FestivalSetRepository {
	private static readonly COLLECTION = "festivals";
	private static readonly SUB_COLLECTION = "sets";

	constructor(
		@Inject("Firestore")
		private readonly firestore: typeof fs
	) {}

	async getSet(festivalId: string, setId: string): Promise<DocumentSnapshot> {
		return this.firestore
			.collection(FestivalSetRepository.COLLECTION)
			.doc(festivalId)
			.collection(FestivalSetRepository.SUB_COLLECTION)
			.doc(setId)
			.get();
	}
}
