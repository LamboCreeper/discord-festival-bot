import { ModelOptions, Prop } from "@typegoose/typegoose";
import { BaseModel } from "./BaseModel";

@ModelOptions({ schemaOptions: { collection: "festivals" }})
export class FestivalModel extends BaseModel {

	@Prop({ required: true })
	date!: Date;

	@Prop({ required: true })
	guild_id!: string;

	@Prop({ required: true })
	event_id!: string;
}
