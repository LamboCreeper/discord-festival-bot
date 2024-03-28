import { injectable as Injectable } from "tsyringe";
import { FestivalSetRepository } from "../repositories/FestivalSetRepository";
import { FestivalSetModel } from "../models/FestivalSetModel";

@Injectable()
export default class FestivalSetService {
	constructor(
		private readonly festivalSetRepository: FestivalSetRepository
	) {}

	async getSet(setId: string): Promise<FestivalSetModel | null> {
		return this.festivalSetRepository.getById(setId);
	}
}
