import { ModelOptions, Prop } from "@typegoose/typegoose";
import { BaseModel } from "./BaseModel";

class FestivalDisplayModel {
	@Prop()
	emoji?: string;

	@Prop()
	colour?: string;
}

@ModelOptions({ schemaOptions: { collection: "festivals" }})
export class FestivalModel extends BaseModel {

	@Prop({ required: true })
	date!: Date;

	@Prop({ required: true })
	guild_id!: string;

	@Prop({ required: true })
	event_id!: string;

	@Prop({ required: true, default: true })
	accepting_submissions!: boolean;

	@Prop({ required: true })
	announcement_channel!: string;

	@Prop()
	display?: FestivalDisplayModel;
}


