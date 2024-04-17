interface ActiveFestival {
	id: string;
	name: string;
	display?: {
		emoji?: string;
		colour?: string;
	}
}

interface ActiveSet {
	id: string;
	name: string;
	start_time?: Date;
	tracklist: {
		[Key: number]: string;
	}
}

export default class SetCache {
	private static activeFestival: ActiveFestival | undefined;
	private static activeSet: ActiveSet | undefined;

	static getActiveFestival(): ActiveFestival | undefined {
		return SetCache.activeFestival;
	}

	static getActiveSet(): ActiveSet | undefined {
		return SetCache.activeSet;
	}

	static setActiveFestival(festival: ActiveFestival): void {
		SetCache.activeFestival = festival;
	}

	static setActiveSet(set: ActiveSet): void {
		console.log('Setting Active Set', set);

		SetCache.activeSet = set;
	}

}
