interface ActiveSet {
	id: string;
	name: string;
	start_time: Date;
	tracklist: {
		[Key: number]: string;
	}
}

export default class SetCache {
	private static activeFestival = "Pdj2XouRDZjExnkKDVFU";
	private static activeSet: ActiveSet | undefined;

	static getActiveFestival(): string {
		return SetCache.activeFestival;
	}

	static getActiveSet(): ActiveSet | undefined {
		return SetCache.activeSet;
	}

	static setActiveSet(set: ActiveSet): void {
		console.log('Setting Active Set', set);

		SetCache.activeSet = set;
	}

}