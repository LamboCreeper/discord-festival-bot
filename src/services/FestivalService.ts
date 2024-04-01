import { injectable as Injectable } from "tsyringe";
import { type GuildScheduledEvent } from "discord.js";
import { FestivalRepository } from "../repositories/FestivalRepository";

@Injectable()
export default class FestivalService {

	constructor(
		private readonly festivalRepository: FestivalRepository
	) {}

	async createFestivalFromEvent(event: GuildScheduledEvent): Promise<void> {
		if (!event.scheduledStartAt) {
			throw new Error("Event must have a start date.");
		}

		await this.festivalRepository.create({
			date: event.scheduledStartAt,
			event_id: event.id,
			guild_id: event.guild!.id
		});
	}
}
