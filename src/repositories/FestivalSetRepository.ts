import { injectable as Injectable } from "tsyringe";
import { BaseRepository } from "./BaseRepository";
import { FestivalSetModel } from "../models/FestivalSetModel";

@Injectable()
export class FestivalSetRepository extends BaseRepository<FestivalSetModel> {
	constructor() {
		super(FestivalSetModel);
	}
}
