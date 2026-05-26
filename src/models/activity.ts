import mongoose, { Schema, Document, Model } from "mongoose";

export interface IActivity extends Document {
   id: string,
   name: string,
   age: number,
}

const ActivitySchema: Schema<IActivity> = new mongoose.Schema({
   id: {
    type: String,
    required: true,
    unique: true
   },

   name: {
    type: String,
    required: true,
   },

   age: {
    type: Number,
    required: false,
   }
   }, {
    timestamps: true,
});

const Activity = mongoose.model<IActivity>("Activity", ActivitySchema, "collection");

export default Activity;