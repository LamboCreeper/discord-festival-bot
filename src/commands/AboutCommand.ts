import { Discord, Slash } from "discordx";
import { CommandInteraction, InteractionResponse } from "discord.js";

@Discord()
export default class AboutCommand {

	@Slash({
		name: "about",
		description: "Get information about the bot"
	})
	async onExecute(interaction: CommandInteraction): Promise<InteractionResponse> {
		return interaction.reply({
			content: `${interaction.client.user.username} allows you to manage a virtual festival within Discord!`,
			ephemeral: true,
		});
	}
}