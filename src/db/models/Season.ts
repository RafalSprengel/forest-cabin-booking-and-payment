import mongoose, { Schema } from 'mongoose';

export interface ISeason {
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const PriceTierSchema = new Schema({
  minGuests: { type: Number, required: true },
  maxGuests: { type: Number, required: true },
  price: { type: Number, required: true }
}, { _id: false });

const SeasonSchema = new Schema<ISeason>({
  name: { type: String, required: true },
  description: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.models.Season || mongoose.model<ISeason>('Season', SeasonSchema);