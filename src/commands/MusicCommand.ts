import { Discord, Slash, SlashOption } from "discordx";
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
		interaction: CommandInteraction
	): Promise<InteractionResponse> {
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

		const resource = createAudioResource(url, {
			inlineVolume: true
		});

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

		return interaction.reply("lol");
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
				{ name: "Player Status", value: `\`${MusicCommand.player.state.status}\``, inline: true }
			]);

		return interaction.reply({
			embeds: [embed]
		});
	}
}