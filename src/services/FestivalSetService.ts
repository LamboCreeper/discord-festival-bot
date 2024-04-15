import { injectable as Injectable} from "tsyringe";
import { Types } from "mongoose";
import { GuildScheduledEvent, StageChannel } from "discord.js";
import { FestivalSetRepository } from "../repositories/FestivalSetRepository";
import { FestivalSetModel } from "../models/FestivalSetModel";
import { FestivalRepository } from "../repositories/FestivalRepository";
import { AudioService } from "./AudioService";
import {GoogleDriveUtils} from "../utils/GoogleDriveUtils";

const ObjectId = Types.ObjectId;

@Injectable()
export default class FestivalSetService {

	constructor(
		private readonly festivalSetRepository: FestivalSetRepository,
		private readonly festivalRepository: FestivalRepository,
		private readonly audioService: AudioService,
	) {
	}

	parseSubmittedTracklist(tracklist: string): Record<number, string> {
		const parsed: Record<number, string> = {};

		tracklist.split("\n").forEach(track => {
			const [time, song] = track.trim().split("] ");
			const timeFormatted = time.replace("[", "");
			const [minutes, seconds] = timeFormatted.split(":").map(Number);

			const totalInSeconds = (minutes * 60) + seconds;

			parsed[totalInSeconds] = song.trim();
		});

		return parsed;
	}

	async getSet(setId: string): Promise<FestivalSetModel | null> {
		return this.festivalSetRepository.getById(setId);
	}

	async getSetsForFestival(festivalId: string): Promise<FestivalSetModel[]> {
		return this.festivalSetRepository.getAll({
			festival: new ObjectId(festivalId)
		});
	}

	async createSet(festivalId: string, set: Omit<FestivalSetModel, "_id" | "created" | "festival">){
		const festival = await this.festivalRepository.getById(festivalId);

		if (!festival) {
			throw new Error("Unknown festival, unable to create set.");
		}

		if (!festival.accepting_submissions) {
			throw new Error("Festival is no longer accepting submissions.");
		}

		return this.festivalSetRepository.create({
			festival,
			...set
		});
	}

	async hasUserAlreadySubmittedSetForFestival(userId: string, festivalId: string): Promise<boolean> {
		const festivals = await this.festivalSetRepository.getAll({
			user_id: userId,
			festival: new ObjectId(festivalId)
		});

		return festivals.length > 0;
	}

	async playSet(event: GuildScheduledEvent, set: FestivalSetModel) {
		const voice = event.channel;

		if (!voice) {
			throw new Error("Festival event has no voice channel. Can not play audio.");
		}

		try {
			const url = GoogleDriveUtils.getDownloadLink(set.audio_file);

			await this.audioService.playInVoiceChannel(
				this.audioService.createAudioResource(url),
				voice,
				() => {
					if (voice instanceof StageChannel) {
						try {
							voice.stageInstance?.setTopic(event.name);
							this.audioService.setSpeaker(voice, set.user_id, false);
						} catch (error) {
							console.warn(error);
						}
					}
				}
			);
		} catch (error) {
			console.error("Unable to play audio", { error });
		}

		if (voice instanceof StageChannel) {
			try {
				voice.stageInstance?.setTopic(`${set.name} @ ${event.name}`);

				this.audioService.setSpeaker(voice, set.user_id, true);
			} catch (error) {
				console.warn(error);
			}
		}
	}
}
