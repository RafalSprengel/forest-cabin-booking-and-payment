import mongoose, { Schema, Document } from 'mongoose';

export interface IRateTier {
  minGuests: number;
  maxGuests: number;
  price: number;
}

export interface ISeasonPrices {
  _id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  weekdays: IRateTier[];
  weekends: IRateTier[];
  extraBedPrice: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const RateTierSchema = new Schema<IRateTier>({
  minGuests: { type: Number, required: true, min: 1 },
  maxGuests: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 }
}, { _id: false });

const SeasonPricesSchema = new Schema<ISeasonPrices>({
  _id: { type: String, default: 'main' },
  name: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  weekdays: { type: [RateTierSchema], required: true, default: [] },
  weekends: { type: [RateTierSchema], required: true, default: [] },
  extraBedPrice: { type: Number, default: 50, min: 0 },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true,
  versionKey: false
});

SeasonPricesSchema.index({ startDate: 1, endDate: 1 });
SeasonPricesSchema.index({ isActive: 1 });

export default mongoose.models.SeasonPrices || mongoose.model<ISeasonPrices>('SeasonPrices', SeasonPricesSchema);