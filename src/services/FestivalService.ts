import { injectable as Injectable } from "tsyringe";
import { Guild, type GuildScheduledEvent } from "discord.js";
import { FestivalRepository } from "../repositories/FestivalRepository";
import { GuildFestivalCache } from "../stores/GuildFestivalCache";
import { DateTimeUtils } from "../utils/DateTimeUtils";

@Injectable()
export default class FestivalService {
	private static readonly EXPIRE_FESTIVAL_CACHE_AFTER = 86_400;

	constructor(
		private readonly festivalRepository: FestivalRepository
	) {}

	async getAllFestivalsForGuild(guild: Guild) {
		let festivalCache = GuildFestivalCache.get(guild.id);
		let festivals = festivalCache?.value;

		const shouldExpireCache = DateTimeUtils.calculateDifference(festivalCache.lastCachedAt, new Date()) > FestivalService.EXPIRE_FESTIVAL_CACHE_AFTER;

		if (!festivalCache || shouldExpireCache) {
			const [dbFestivals, events] = await Promise.all([
				this.festivalRepository.getAll({ guild_id: guild.id }),
				guild.scheduledEvents.fetch()
			]);

			GuildFestivalCache.set(guild.id, dbFestivals.map(fest => ({
				id: fest._id.toString(),
				name: events.find(e => e.id === fest.event_id)?.name ?? ""
			})));
		}

		return festivals ?? [];
	}

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
