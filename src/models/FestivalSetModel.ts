import { ModelOptions, Prop } from "@typegoose/typegoose";
import { BaseModel } from "./BaseModel";
import { FestivalSetStatus } from "../enums/FestivalSetStatus";

@ModelOptions({ schemaOptions: { collection: "festival_sets" }})
export class FestivalSetModel extends BaseModel {
	@Prop({ required: true })
	name!: string;

	@Prop({ required: true, default: FestivalSetStatus.PENDING })
	status!: FestivalSetStatus

	@Prop({ required: true })
	user_id!: string;

	@Prop({ required: true })
	tracklist!: Record<number, string>

	@Prop({ required: true })
	audio_file!: string;

	@Prop({ required: true })
	start_time?: Date;
}
