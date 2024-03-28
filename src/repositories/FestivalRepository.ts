import { injectable as Injectable } from "tsyringe";
import { BaseRepository } from "./BaseRepository";
import { FestivalModel } from "../models/FestivalModel";

@Injectable()
export class FestivalRepository extends BaseRepository<FestivalModel> {
	constructor() {
		super(FestivalModel);
	}
}
