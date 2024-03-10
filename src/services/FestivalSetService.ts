import { injectable as Injectable } from "tsyringe";
import FestivalSetRepository from "../repositories/FestivalSetRepository";
import type { DocumentSnapshot } from "firebase-admin/firestore";

@Injectable()
export default class FestivalSetService {
	constructor(
		private readonly festivalSetRepository: FestivalSetRepository
	) {}

	async getSet(festivalId: string, setId: string): Promise<DocumentSnapshot> {
		return this.festivalSetRepository.getSet(festivalId, setId);
	}
}
