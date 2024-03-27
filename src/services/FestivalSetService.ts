import { injectable as Injectable } from "tsyringe";
import FestivalSetRepository from "../repositories/FestivalSetRepository";
import type { DocumentSnapshot, DocumentReference } from "firebase-admin/firestore";
import IFestivalSet from "../interfaces/IFestivalSet";

@Injectable()
export default class FestivalSetService {
	constructor(
		private readonly festivalSetRepository: FestivalSetRepository
	) {}

	async getSet(festivalId: string, setId: string): Promise<DocumentSnapshot> {
		return this.festivalSetRepository.getSet(festivalId, setId);
	}

	async createSet(festivalId: string, set: IFestivalSet): Promise<DocumentReference> {
		return this.festivalSetRepository.createSet(festivalId, set)
	}
}
