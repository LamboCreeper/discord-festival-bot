interface ICachedFestival {
	id: string;
	name: string;
}

interface ICachedFestivals {
	[Guild: string]: {
		lastCachedAt: Date;
		value: ICachedFestival[];
	}
}

export class GuildFestivalCache {
	private static guildFestivals: ICachedFestivals = {};

	static get(guildId: string) {
		return GuildFestivalCache.guildFestivals[guildId];
	}

	static set(guildId: string, value: ICachedFestival[]) {
		GuildFestivalCache.guildFestivals[guildId] = {
			lastCachedAt: new Date(),
			value
		};
	}
}
