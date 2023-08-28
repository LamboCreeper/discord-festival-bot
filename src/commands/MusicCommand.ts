import { Discord, Slash, SlashOption } from "discordx";
import {
	CommandInteraction,
	EmbedBuilder,
	GuildMember,
	InteractionResponse,
	PermissionsBitField,
	ApplicationCommandOptionType,
	BaseGuildTextChannel
} from "discord.js";
import {
	createAudioPlayer,
	createAudioResource,
	generateDependencyReport,
	joinVoiceChannel,
} from "@discordjs/voice";
import { firestore } from "../app";
import SetCache from "../stores/SetCache";

console.log(generateDependencyReport());

@Discord()
export default class MusicCommand {
	private static readonly player = createAudioPlayer();

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
				console.log(`festivals/${SetCache.getActiveFestival()}/sets/${setId}`);

				const set = await firestore.doc(
					`festivals/${SetCache.getActiveFestival()}/sets/${setId}`
				).get();


				if (!set.exists) {
					return interaction.editReply({
						content: "Unknown set."
					});
				}

				const setData = set.data();

				if (!setData) {
					return interaction.editReply({
						content: "No set data."
					});
				}

				console.log(setData);

				title = setData.name;

				SetCache.setActiveSet({
					id: set.id,
					tracklist: setData.tracklist,
					start_time: setData.start_time.toDate(),
					name: setData.name
				});

				resource = createAudioResource(setData.audio_file, {
					inlineVolume: true
				});
			}

			const connection = joinVoiceChannel({
				adapterCreator: channel.guild.voiceAdapterCreator,
				guildId: channel.guild.id,
				channelId: channel.id,
			});

			const networkStateChangeHandler = (oldNetworkState: any, newNetworkState: any) => {
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

			const announcementChannel = await guild.channels.fetch("133741089575141377");

			if (announcementChannel) {
				const embed = new EmbedBuilder()
					.setTitle('Summer Signal')
					.setDescription(`**${title}** is now playing! <:signal:1073292494999142401>`)
					.setColor("#F6AA73");

				await (announcementChannel as BaseGuildTextChannel).send({
					embeds: [embed]
				});
			}
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
			const set = SetCache.getActiveSet();

			if (!set) {
				return interaction.reply({
					content: "There is no active set.",
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

			const embed = new EmbedBuilder()
				.setTitle(`${set.name} @ Summer Signal`)
				.setDescription(`The current track is **${res}**! <:signal:1073292494999142401>`)
				.setColor("#F6AA73");

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
				{ name: "Active Festival", value: `\`${SetCache.getActiveFestival() ?? 'None'}\``, inline: true },
				{ name: "Active Set", value: `\`${SetCache.getActiveSet()?.id ?? 'None'}\``, inline: true }
			]);

		return interaction.reply({
			embeds: [embed]
		});
	}
}