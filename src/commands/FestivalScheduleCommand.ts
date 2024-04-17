import { Discord, Slash, SlashOption } from "discordx";
import { injectable as Injectable } from "tsyringe";
import FestivalSetService from "../services/FestivalSetService";
import { ApplicationCommandOptionType, CommandInteraction, time } from "discord.js";
import { FestivalSetModel } from "../models/FestivalSetModel";

@Discord()
@Injectable()
export class FestivalScheduleCommand {
	constructor(
		private readonly festivalSetService: FestivalSetService
	) {}

	@Slash({
		name: "schedule",
		description: "Get a festival's schedule"
	})
	async onFestivalScheduleCommand(
		@SlashOption({
			name: "festival",
			description: "The festival you would like the schedule for",
			type: ApplicationCommandOptionType.String,
			autocomplete: (i) => i.respond([{
				name: "420skrillfest",
				value: "6605bbdff001bcb04850d072"
			}])
		})
		festival: string,
		interaction: CommandInteraction
	) {
		await interaction.deferReply();

		const sets = await this.festivalSetService.getSetsForFestival(festival);
		const scheduledSets = sets
			.filter((set): set is FestivalSetModel & { start_time: Date } => !!set.start_time)
			.sort((a, b) => a.start_time.getTime() > b.start_time.getTime() ? 1 : -1);

		await interaction.editReply({
			content: `## Schedule\n${scheduledSets.map(set => `- ${time(set.start_time.getTime() / 1000, "t")} - ${set.name}`).join("\n")}`
		});
	}
}
