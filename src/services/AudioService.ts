import { injectable as Injectable } from "tsyringe";
import { AudioResource, createAudioPlayer, createAudioResource, joinVoiceChannel } from "@discordjs/voice";
import { StageChannel, VoiceChannel } from "discord.js";
import { Readable } from "stream";
import { HTTPService } from "./HTTPService";

@Injectable()
export class AudioService {
	private static readonly player = createAudioPlayer();

	constructor(
		private readonly httpService: HTTPService
	) {}

	async createAudioResource(source: string): Promise<AudioResource> {
		const audioStream = await this.httpService.get<Readable>(source, {
			responseType: "stream"
		});

		return createAudioResource(audioStream, {
			inlineVolume: true
		});
	}

	setSpeaker(voice: StageChannel, userId: string, isSpeaker: boolean) {
		voice.members.find(member => member.id === userId)?.voice.setSuppressed(!isSpeaker);
	}

	async playInVoiceChannel(resource: AudioResource, channel: VoiceChannel | StageChannel, onIdle?: Function) {
		const connection = joinVoiceChannel({
			adapterCreator: channel.guild.voiceAdapterCreator,
			guildId: channel.guild.id,
			channelId: channel.id
		});

		const networkStateChangeHandler = (_: unknown, newNetworkState: object) => {
			clearInterval(Reflect.get(newNetworkState, 'udp')?.keepAliveInterval);
		}

		connection.on("stateChange", (oldState, newState) => {
			Reflect.get(oldState, "networking")?.off("stateChange", networkStateChangeHandler);
			Reflect.get(newState, "networking")?.on("stageChange", networkStateChangeHandler);
		});

		connection.subscribe(AudioService.player);

		AudioService.player.on("stateChange", (oldState, newState) => {
			console.log(`[AudioService][Player] State Change: ${oldState.status} -> ${newState.status}`);

			if (newState.status === "idle") {
				onIdle?.();
			}
		});


		AudioService.player.on("error", console.error);

		AudioService.player.play(resource);
	}
}
