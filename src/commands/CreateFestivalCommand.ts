import { Discord, Slash, SlashOption } from "discordx";
import { injectable as Injectable } from "tsyringe";
import type { CommandInteraction, InteractionResponse, Message } from "discord.js";
import { ApplicationCommandOptionType, AutocompleteInteraction, PermissionsBitField } from "discord.js";
import FestivalService from "../services/FestivalService";

@Discord()
@Injectable()
export default class CreateFestivalCommand {
	constructor(
		private readonly festivalService: FestivalService
	) {}

	private static async handleEventAutocomplete(interaction: AutocompleteInteraction) {
		const events = await interaction.guild?.scheduledEvents.fetch();
		const formattedEvents = Array.from(events?.entries() ?? []);

		return interaction.respond(formattedEvents.map(([ eventId, event]) => ({
			name: event.name,
			value: eventId
		})))
	}

	@Slash({
		name: "create",
		description: "Create a festival from an event",
		defaultMemberPermissions: [PermissionsBitField.Flags.ManageEvents]
	})
	async onCreateFestivalCommand(
		@SlashOption({
			name: "event",
			description: "The event you would like to create a festival for",
			type: ApplicationCommandOptionType.String,
			autocomplete: CreateFestivalCommand.handleEventAutocomplete
		})
		eventId: string,
		interaction: CommandInteraction
	): Promise<InteractionResponse | Message> {
		await interaction.deferReply();
		await interaction.editReply({
			content: `Creating event... (\`${eventId}\`)`
		});

		const guild = interaction.guild;

		if (!guild) {
			return interaction.editReply({
				content: "Error: This command can only be executed within a guild."
			});
		}

		const event = await guild.scheduledEvents.fetch(eventId);

		if (!event) {
			return interaction.editReply({
				content: `Error: No event found with ID of \`${eventId}\`.`
			});
		}

		try {
			await this.festivalService.createFestivalFromEvent(event);
		} catch (error) {
			console.error(error);

			return interaction.editReply("Error: Failed to create festival.");
		}

		return interaction.editReply({
			content: `Successfully created an festival for event '${event.name}' (\`${eventId}\`).`
		});
	}
}
