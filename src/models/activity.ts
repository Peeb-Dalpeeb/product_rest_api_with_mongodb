import { Schema, model } from "mongoose";

export interface IActivity {
    name: string;
    age?: number; // Aligned with 'required: false' in schema
}

const ActivitySchema = new Schema<IActivity>({
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

const Activity = model<IActivity>("Activity", ActivitySchema);

export default Activity;