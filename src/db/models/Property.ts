// src/db/models/Property.ts
import mongoose, { Schema, Document } from 'mongoose';

interface IPriceTier {
  minGuests: number;
  maxGuests: number;
  price: number;
}

export interface ISeasonRates {
  seasonId: mongoose.Types.ObjectId;
  weekdayPrices: IPriceTier[];
  weekendPrices: IPriceTier[];
  weekdayExtraBedPrice: number;
  weekendExtraBedPrice: number;
}

export interface IProperty extends Document {
  name: string;
  slug?: string;
  description?: string;
  baseCapacity: number;
  maxExtraBeds: number;
  images?: string[];
  isActive: boolean;
  type: 'single' | 'whole';
  basicPrices?: {
    weekdayPrices: IPriceTier[];
    weekendPrices: IPriceTier[];
    weekdayExtraBedPrice: number;
    weekendExtraBedPrice: number;
  };
  seasonPrices?: ISeasonRates[];
}

const PriceTierSchema = new Schema({
  minGuests: { type: Number, required: true },
  maxGuests: { type: Number, required: true },
  price: { type: Number, required: true }
}, { _id: false });

const SeasonRatesSchema = new Schema({
  seasonId: { type: Schema.Types.ObjectId, ref: 'Season', required: true },
  weekdayPrices: { type: [PriceTierSchema], required: true },
  weekendPrices: { type: [PriceTierSchema], required: true },
  weekdayExtraBedPrice: { type: Number, default: 50 },
  weekendExtraBedPrice: { type: Number, default: 70 }
}, { _id: false });

const PropertySchema = new Schema<IProperty>({
  name: { type: String, required: true, trim: true },
  slug: { type: String, trim: true, index: true },
  description: { type: String, trim: true },
  baseCapacity: { type: Number, required: true, default: 6 },
  maxExtraBeds: { type: Number, required: true, default: 2 },
  images: { type: [String], default: [] },
  isActive: { type: Boolean, default: true },
  type: { type: String, enum: ['single', 'whole'], default: 'single' },
  basicPrices: {
    type: {
      weekdayPrices: [PriceTierSchema],
      weekendPrices: [PriceTierSchema],
      weekdayExtraBedPrice: { type: Number, default: 50 },
      weekendExtraBedPrice: { type: Number, default: 70 }
    },
    default: undefined
  },
  seasonPrices: { type: [SeasonRatesSchema], default: [] }
}, { timestamps: true });

export default mongoose.models.Property || mongoose.model<IProperty>('Property', PropertySchema);