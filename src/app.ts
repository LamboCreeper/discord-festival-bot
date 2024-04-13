import "reflect-metadata";
import { Client, DIService, tsyringeDependencyRegistryEngine } from "discordx";
import { Events, IntentsBitField } from "discord.js";
import DirectoryUtils from "./utils/DirectoryUtils";
import { container } from "tsyringe";
import mongoose from "mongoose";
import FestivalService from "./services/FestivalService";
import { FestivalSchedulingService } from "./services/FestivalSchedulingService";

class App {
	private static COMMANDS_DIRECTORY = "commands";
	private readonly client: Client;
	constructor() {
		if (!process.env.DISCORD_TOKEN) {
			throw new Error("You must supply the DISCORD_TOKEN environment variable.");
		}

		DIService.engine = tsyringeDependencyRegistryEngine.setInjector(container);

		this.client = new Client({
			botId: process.env.DISCORD_BOT_ID,
			botGuilds: ["542108932878106625", "133741089575141377"],
			silent: false,
			intents: [
				IntentsBitField.Flags.Guilds,
				IntentsBitField.Flags.GuildVoiceStates
			]
		});
	}

	async init(): Promise<void> {
		this.client.once(Events.ClientReady, async () => {
			await this.client.initApplicationCommands();

			if (!process.env.MONGO_URI) {
				throw new Error("You must supply the MONGO_URI environment variable.");
			}

			await mongoose.connect(process.env.MONGO_URI, {
				dbName: "festivals"
			});

			const festivalService = container.resolve(FestivalService);
			const schedulingService = container.resolve(FestivalSchedulingService);

			const festivals = await festivalService.getFutureFestivals();

			festivals.map(schedulingService.scheduleFestival);
		});

		await DirectoryUtils.getFilesInDirectory(
			`${__dirname}/${App.COMMANDS_DIRECTORY}`,
			DirectoryUtils.appendFileExtension("Command")
		);

		console.log(`${__dirname}/${App.COMMANDS_DIRECTORY}`);

		this.client.on(Events.InteractionCreate, async (interaction) => {
			try {
				await this.client.executeInteraction(interaction);
			} catch (error) {
				console.error(error);
			}
		});

		await this.client.login(process.env.DISCORD_TOKEN!);
	}
}

new App().init();
