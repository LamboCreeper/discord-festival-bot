import { injectable as Injectable } from "tsyringe";
import { type GuildScheduledEvent } from "discord.js";
import { FestivalRepository } from "../repositories/FestivalRepository";
import { FestivalModel } from "../models/FestivalModel";
import { FestivalSchedulingService } from "./FestivalSchedulingService";

@Injectable()
export default class FestivalService {
	constructor(
		private readonly festivalRepository: FestivalRepository,
		private readonly festivalSchedulingService: FestivalSchedulingService
	) {}

	async createFestivalFromEvent(event: GuildScheduledEvent): Promise<void> {
		if (!event.scheduledStartAt) {
			throw new Error("Event must have a start date.");
		}

		const festival = await this.festivalRepository.create({
			date: event.scheduledStartAt,
			event_id: event.id,
			guild_id: event.guild!.id
		});

		this.festivalSchedulingService.scheduleFestival(festival);
	}

	async getFutureFestivals(): Promise<FestivalModel[]> {
		return this.festivalRepository.getAll({
			date: { $gt: new Date() }
		});
	}
}
