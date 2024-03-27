import FestivalSetStatus from "../enums/FestivalSetStatus";

export default interface IFestivalSet {
	name: string;
	user_id: string;
	audio_file: string;
	tracklist: Record<number, string>;
	status: FestivalSetStatus;
}
