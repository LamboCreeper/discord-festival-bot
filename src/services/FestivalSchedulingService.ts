import {inject as Inject, injectable as Injectable} from "tsyringe";
import { scheduleJob } from "node-schedule";
import { GuildManager } from "discord.js";
import FestivalSetService from "./FestivalSetService";
import { FestivalModel } from "../models/FestivalModel";
import { FestivalSetModel } from "../models/FestivalSetModel";
import SetCache from "../stores/SetCache";

@Injectable()
export class FestivalSchedulingService {
	constructor(
		private readonly festivalSetService: FestivalSetService,
		@Inject('GuildManager')
		private readonly guildManager: GuildManager
	) {}

	private isCompleteSet(set: FestivalSetModel): set is Required<FestivalSetModel> {
		return !!set.start_time;
	}

	private orderByStartTime(a: { start_time: Date }, b: { start_time: Date }) {
		return a.start_time > b.start_time ? 1 : -1;
	}

	scheduleFestival = (festival: FestivalModel)=> {
		console.log(`Scheduled festival '${festival._id.toString()}' for ${festival.date}`);

		scheduleJob(festival.date, async () => {
			console.log(`Starting festival '${festival._id.toString()}'`);

			try {
				const guild = await this.guildManager.fetch(festival.guild_id);
				const event = await guild.scheduledEvents.fetch(festival.event_id);

				const festivalSets = await this.festivalSetService.getSetsForFestival(festival._id.toString());
				const orderedSets = festivalSets
					.filter(this.isCompleteSet)
					.sort(this.orderByStartTime);

				await Promise.all(orderedSets.map(set => scheduleJob(set.start_time, () => {
					console.log(`Starting set '${set._id.toString()}'`);

					SetCache.setActiveSet({
						id: set._id.toString(),
						name: set.name,
						start_time: set.start_time,
						tracklist: set.tracklist
					});

					try {
						this.festivalSetService.playSet(event, set);
					} catch (error) {
						console.error(error);
					}
				})));
			} catch (error) {
				console.error(error);
			}
		});
	}
}
