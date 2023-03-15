import "reflect-metadata";
import { Client } from "discordx";
import { Events, IntentsBitField } from "discord.js";
import DirectoryUtils from "./utils/DirectoryUtils";

class App {
	private static COMMANDS_DIRECTORY = "commands";
	private readonly client: Client;
	constructor() {
		if (!process.env.DISCORD_TOKEN) {
			throw new Error("You must supply the DISCORD_TOKEN environment variable.");
		}

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
		});

		await DirectoryUtils.getFilesInDirectory(
			`${__dirname}/${App.COMMANDS_DIRECTORY}`,
			DirectoryUtils.appendFileExtension("Command")
		);

		console.log(`${__dirname}/${App.COMMANDS_DIRECTORY}`);

		this.client.on(Events.InteractionCreate, (interaction) => {
			this.client.executeInteraction(interaction);
		});

		await this.client.login(process.env.DISCORD_TOKEN!);
	}
}

new App().init();