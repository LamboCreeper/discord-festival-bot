import { Discord, Slash, SlashOption } from "discordx";
import { injectable as Injectable } from "tsyringe";
import {
	CommandInteraction,
	EmbedBuilder,
	GuildMember,
	InteractionResponse,
	PermissionsBitField,
	ApplicationCommandOptionType
} from "discord.js";
import {
	createAudioPlayer,
	createAudioResource,
	generateDependencyReport,
	joinVoiceChannel,
} from "@discordjs/voice";
import SetCache from "../stores/SetCache";
import FestivalSetService from "../services/FestivalSetService";
import { DiscordUtils } from "../utils/DiscordUtils";
import {GoogleDriveUtils} from "../utils/GoogleDriveUtils";

console.log(generateDependencyReport());

@Discord()
@Injectable()
export default class MusicCommand {
	private static readonly player = createAudioPlayer();

	constructor(
		private readonly festivalSetService: FestivalSetService
	) {}

	@Slash({
		name: "play",
		description: "Play audio",
		defaultMemberPermissions: [PermissionsBitField.Flags.ManageEvents]
	})
	async onPlayCommand(
		@SlashOption({
			name: "url",
			description: "The URL of the set",
			type: ApplicationCommandOptionType.String,
		})
		url: string,
		@SlashOption({
			name: "id",
			description: "The ID of the set",
			type: ApplicationCommandOptionType.String,
		})
		setId: string,
		interaction: CommandInteraction
	) {
		try {
			await interaction.deferReply();

			const {guild, member} = interaction;

			if (!guild || !member || !(member instanceof GuildMember)) {
				return interaction.editReply({
					content: "This command is only executable within a guild."
				});
			}

			const channel = member.voice?.channel;

			if (!channel) {
				return interaction.editReply({
					content: "You must be in a guild voice channel to execute this command."
				});
			}

			let resource;
			const paths = url?.split('/');
			let title = paths?.[paths?.length - 1] ?? 'Unknown';

			if (!url && !setId) {
				return interaction.editReply({
					content: "You must supply either a URL or set ID."
				});
			}

			if (url) {
				resource = createAudioResource(url, {
					inlineVolume: true
				});
			} else {
				const set = await this.festivalSetService.getSet(setId);

				if (!set) {
					return interaction.editReply({
						content: "Unknown set."
					});
				}

				const audio = GoogleDriveUtils.getDownloadLink(set.audio_file);


				console.log(set);

				title = set.name;

				SetCache.setActiveSet({
					id: set._id.toString(),
					tracklist: set.tracklist,
					start_time: set.start_time,
					name: set.name
				});

				resource = createAudioResource(audio, {
					inlineVolume: true
				});
			}

			const connection = joinVoiceChannel({
				adapterCreator: channel.guild.voiceAdapterCreator,
				guildId: channel.guild.id,
				channelId: channel.id,
			});

			const networkStateChangeHandler = (_oldNetworkState: any, newNetworkState: any) => {
				const newUdp = Reflect.get(newNetworkState, 'udp');
				clearInterval(newUdp?.keepAliveInterval);
			}

			connection.on('stateChange', (oldState, newState) => {
				Reflect.get(oldState, 'networking')?.off('stateChange', networkStateChangeHandler);
				Reflect.get(newState, 'networking')?.on('stateChange', networkStateChangeHandler);
			});

			connection.subscribe(MusicCommand.player);

			MusicCommand.player.on('stateChange', (oldState, newState) => {
				console.log(`Player state changed from ${oldState.status} to ${newState.status}`)
			})

			MusicCommand.player.on('error', (error) => {
				console.error(error);
			});

			MusicCommand.player.play(resource);

			return interaction.editReply(`Now playing "${title}"`);
		} catch (error) {
			console.error(error);
		}

		return interaction.editReply("lol");
	}

	@Slash({
		name: "track",
		description: "Get the current track set"
	})
	async onPlayingCommand(interaction: CommandInteraction) {
		try {
			const festival = SetCache.getActiveFestival();
			const set = SetCache.getActiveSet();

			if (!set || !festival) {
				return interaction.reply({
					content: "There is no active set.",
					ephemeral: true
				});
			}

			if (!set.start_time) {
				return interaction.reply({
					content: "The active set does not have a valid start time.",
					ephemeral: true
				});
			}

			const now = new Date();
			const diff = Math.abs((now.getTime() - set.start_time.getTime()) / 1000);

			console.log(now, set.start_time, diff);

			let res = 'Unknown';

			const tracktimes = Object.keys(set.tracklist).map(Number);

			for (let i = 0; i < tracktimes.length; i++) {
				if (tracktimes[i] < diff) {
					res = set.tracklist[tracktimes[i]];
				}
			}

			const colour = festival.display?.colour
				? (
					DiscordUtils.isColourResolvable(festival.display.colour)
						? festival.display.colour
						: "#FFFFFF"
				) : "#FFFFFF";

			const embed = new EmbedBuilder()
				.setTitle(`${set.name} @ ${festival.name}`)
				.setDescription(`The current track is **${res}**! ${festival.display?.emoji}`)
				.setColor(colour);

			return interaction.reply({
				embeds: [embed]
			});
		} catch (error: any) {
			console.error(error.message, { error });
		}
	}

	@Slash({
		name: "debug",
		description: "Debug information about the player"
	})
	async onDebugCommand(interaction: CommandInteraction): Promise<InteractionResponse> {
		const { guild, member } = interaction;

		if (!guild || !member || !(member instanceof GuildMember)) {
			return interaction.reply({
				content: "This command is only executable within a guild.",
				ephemeral: true
			});
		}

		const channel = member.voice?.channel;

		if (!channel) {
			return interaction.reply({
				content: "You must be in a guild voice channel to execute this command.",
				ephemeral: true
			});
		}

		const isPlayerInVoice = channel.members.find(
			member => member.id === interaction.client.user.id
		);

		MusicCommand.player.unpause();

		const embed = new EmbedBuilder()
			.setTitle(`${interaction.client.user.username} Debug Information`)
			.addFields([
				{ name: "Guild ID", value: `\`${guild.id}\``, inline: true },
				{ name: "Channel ID", value: `\`${channel.id}\``, inline: true },
				{ name: "Player In Voice", value: `\`${!!isPlayerInVoice}\``, inline: true },
				{ name: "Player Status", value: `\`${MusicCommand.player.state.status}\``, inline: true },
				{ name: "Active Festival", value: `\`${SetCache.getActiveFestival()?.id ?? 'None'}\``, inline: true },
				{ name: "Active Set", value: `\`${SetCache.getActiveSet()?.id ?? 'None'}\``, inline: true }
			]);

		return interaction.reply({
			embeds: [embed]
		});
	}
}
