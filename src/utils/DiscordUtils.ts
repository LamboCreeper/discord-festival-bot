export class DiscordUtils {
	static isColourResolvable(colour: string): colour is `#${string}` {
		return colour.startsWith("#");
	}
}
