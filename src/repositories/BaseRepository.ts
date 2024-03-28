import { getModelForClass, type ReturnModelType } from "@typegoose/typegoose";
import { plainToInstance } from "class-transformer";
import { FilterQuery } from "mongoose";
import { BaseModel } from "../models/BaseModel";

export abstract class BaseRepository<T extends BaseModel> {
	protected readonly _model: ReturnModelType<new () => T>;
	protected readonly _class: new () => T;

	protected constructor(model: new () => T) {
		this._class = model;
		this._model = getModelForClass(model);
	}

	async getById(id: string) {
		return this._model.findById(id);
	}

	async getAll(condition: FilterQuery<T>) {
		return this._model.find(condition).lean();
	}

	async create(data: Omit<T, "_id" | "created">) {
		return this._model.create(plainToInstance(this._class, data));
	}
}
