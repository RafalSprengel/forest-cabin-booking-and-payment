import mongoose, { Schema, Document } from 'mongoose';

interface IPriceTier {
  minGuests: number;
  maxGuests: number;
  price: number;
}

const PriceTierSchema = new Schema(
  {
    minGuests: { type: Number, required: true },
    maxGuests: { type: Number, required: true },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const CustomPriceSchema = new Schema({
  propertyId: {
    type: Schema.Types.ObjectId,
    ref: 'Property',
    required: true,
    index: true,
  },
  date: {
    type: Date,
    required: true,
    index: true,
  },
  weekdayPrices: { type: [PriceTierSchema], required: true, default: [] },
  weekendPrices: { type: [PriceTierSchema], required: true, default: [] },
  weekdayExtraBedPrice: { type: Number, required: true, min: 0, default: 50 },
  weekendExtraBedPrice: { type: Number, required: true, min: 0, default: 70 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

CustomPriceSchema.index({ propertyId: 1, date: 1 }, { unique: true });

export default mongoose.models.CustomPrice ||
  mongoose.model('CustomPrice', CustomPriceSchema);