import { Prop } from "@typegoose/typegoose";
import type { ObjectId } from "mongoose";

export class BaseModel {
	_id!: ObjectId;

	@Prop({ required: true, default: new Date() })
	created!: Date;
}
