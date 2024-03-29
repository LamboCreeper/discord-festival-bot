import { injectable as Injectable } from "tsyringe";
import { Types } from "mongoose";
import { FestivalSetRepository } from "../repositories/FestivalSetRepository";
import { FestivalSetModel } from "../models/FestivalSetModel";
import { FestivalRepository } from "../repositories/FestivalRepository";

const ObjectId = Types.ObjectId;

@Injectable()
export default class FestivalSetService {
	constructor(
		private readonly festivalSetRepository: FestivalSetRepository,
		private readonly festivalRepository: FestivalRepository
	) {}

	parseSubmittedTracklist(tracklist: string): Record<number, string> {
		const parsed: Record<number, string> = {};

		tracklist.split("\n").forEach(track => {
			const [time, song] = track.trim().split("] ");
			const timeFormatted = time.replace("[", "");
			const [minutes, seconds] = timeFormatted.split(":").map(Number);

			const totalInSeconds = (minutes * 60) + seconds;

			parsed[totalInSeconds] = song.trim();
		});

		return parsed;
	}

	async getSet(setId: string): Promise<FestivalSetModel | null> {
		return this.festivalSetRepository.getById(setId);
	}

	async createSet(festivalId: string, set: Omit<FestivalSetModel, "_id" | "created" | "festival">){
		const festival = await this.festivalRepository.getById(festivalId);

		if (!festival) {
			throw new Error("Unknown festival, unable to create set.");
		}

		return this.festivalSetRepository.create({
			festival,
			...set
		})
	}

	async hasUserAlreadySubmittedSetForFestival(userId: string, festivalId: string): Promise<boolean> {
		const festivals = await this.festivalSetRepository.getAll({
			user_id: userId,
			festival: new ObjectId(festivalId)
		});

		return festivals.length > 0;
	}
}
