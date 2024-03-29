import { Discord, Slash, SlashOption } from "discordx";
import { container, injectable as Injectable } from "tsyringe";
import {
	ActionRowBuilder,
	ApplicationCommandOptionType, AutocompleteInteraction,
	ButtonBuilder,
	CommandInteraction,
	EmbedBuilder,
	MessageActionRowComponentBuilder,
	ModalBuilder,
	ModalSubmitInteraction,
	TextInputBuilder
} from "discord.js";
import FestivalSetService from "../services/FestivalSetService";
import { FestivalSetStatus } from "../enums/FestivalSetStatus";
import FestivalService from "../services/FestivalService";

enum SubmitSetModalField {
	NAME = "name",
	URL = "url",
	TRACKLIST = "tracklist"
}

@Discord()
@Injectable()
export default class SubmitSetCommand {
	private readonly userSubmissionCache: Map<string, Record<string, string>> = new Map();

	constructor(
		private readonly festivalSetService: FestivalSetService
	) {}

	private static async handleFestivalAutocomplete(interaction: AutocompleteInteraction) {
		const guildId = interaction.guild?.id;

		if (!guildId) return interaction.respond([]);

		try {
			const festivalService = container.resolve(FestivalService);
			const [festivals, events] = await Promise.all([
				festivalService.getAllFestivalsForGuild(guildId),
				interaction.guild.scheduledEvents.fetch()
			]);

			return interaction.respond(festivals.map(festival => ({
				name: events.find(event => event.id === festival.event_id)?.name ?? "",
				value: festival._id.toString()
			})));
		} catch (error) {
			console.error(error);

			return interaction.respond([]);
		}
	}

	@Slash({
		name: "submit",
		description: "Submit a set to a given festival"
	})
	async onSubmitSetCommand(
		@SlashOption({
			name: "festival",
			description: "The festival you want to submit to",
			type: ApplicationCommandOptionType.String,
			autocomplete: SubmitSetCommand.handleFestivalAutocomplete
		})
		festivalId: string,
		interaction: CommandInteraction
	) {
		if (await this.festivalSetService.hasUserAlreadySubmittedSetForFestival(interaction.user.id, festivalId)) {
			return interaction.reply({
				content: "You have already submitted a set for this festival.",
				ephemeral: true
			});
		}

		await interaction.showModal(this.getModal({ name: interaction.user.displayName }));

		const submission = await interaction.awaitModalSubmit({
			time: 60_000
		});

		if (submission) {
			await this.handleSubmitSetModal(festivalId, submission);
		}
	}

	private getModal(defaults?: { name?: string; url?: string; tracklist?: string }): ModalBuilder {
		const modal = new ModalBuilder()
			.setTitle("Submit Festival Set")
			.setCustomId(this.handleSubmitSetModal.name);

		const nameComponent = new TextInputBuilder()
			.setCustomId(SubmitSetModalField.NAME)
			.setLabel("Performance Name")
			.setStyle(1)
			.setPlaceholder("Example B2B Example")
			.setRequired();

		if (defaults?.name) nameComponent.setValue(defaults.name);

		const urlComponent = new TextInputBuilder()
			.setCustomId(SubmitSetModalField.URL)
			.setLabel("Google Drive Link (mp3 file)")
			.setStyle(1)
			.setPlaceholder("https://drive.google.com/file/{file-id}/view")
			.setRequired();

		if (defaults?.url) urlComponent.setValue(defaults.url);

		const tracklistComponent = new TextInputBuilder()
			.setCustomId(SubmitSetModalField.TRACKLIST)
			.setLabel("Tracklist")
			.setStyle(2)
			.setPlaceholder("[00:00] Some Artist - Some Track\n[01:23] Another Artist - Another Track")
			.setRequired();

		if (defaults?.tracklist) tracklistComponent.setValue(defaults.tracklist);

		modal.addComponents(
			[nameComponent, urlComponent, tracklistComponent].map(component => new ActionRowBuilder<TextInputBuilder>().addComponents(component))
		);

		return modal;
	}

	async handleSubmitSetModal(festivalId: string, interaction: ModalSubmitInteraction) {
		const [name, url, tracklist] = Object.values(SubmitSetModalField).map(id => interaction.fields.getTextInputValue(id));

		this.userSubmissionCache.delete(interaction.user.id);

		const embed = new EmbedBuilder()
			.setTitle("Error Submitting Set")
			.setDescription("URL given was not a valid Google Drive link.")
			.addFields([
				{ name: "Given Name", value: name },
				{ name: "Given URL", value: url },
				{ name: "Given Tracklist", value: tracklist }
			]);

		const errors = [];

		if (!/http(s?):\/\/drive\.google\.com\/file\/d\/.*\/view/.test(url)) {
			errors.push("**The URL supplied was not a valid Google Drive link**\n ↳ Expected format of `https://drive.google.com/file/{file-id}/view`");
		}

		if (!/\[\d\d:\d\d] .* - .*/.test(tracklist)) {
			errors.push("**The tracklist supplied is invalid**\n ↳ Expected format of `[MM:SS] Artist - Track`");
		}

		if (!errors.length) {
			try {
				await this.festivalSetService.createSet(festivalId, {
					name,
					user_id: interaction.user.id,
					audio_file: url,
					tracklist: this.festivalSetService.parseSubmittedTracklist(tracklist),
					status: FestivalSetStatus.PENDING,
				});

				return interaction.reply("Your festival set has been successfully submitted!");
			} catch (error) {
				console.error(error);

				return interaction.reply("There was a problem submitting your set.");
			}
		}

		embed.setDescription(errors.join("\n"));

		const retryButton = new ButtonBuilder()
			.setCustomId("retry-submit")
			.setLabel("Try Again")
			.setStyle(1);

		this.userSubmissionCache.set(interaction.user.id, {
			name, url, tracklist
		});

		const message = await interaction.reply({
			ephemeral: true,
			embeds: [embed],
			components: [
				new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(retryButton)
			]
		});

		const retryInteraction = await message.awaitMessageComponent({
			time: 15_000
		});

		if (retryInteraction) {
			await retryInteraction.showModal(this.getModal({ name, url, tracklist }));
		}

		setTimeout(() => this.userSubmissionCache.delete(interaction.user.id), 15_000);
	}
}
