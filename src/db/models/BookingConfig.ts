import mongoose, { Schema } from 'mongoose';

export interface IBookingConfig {
  _id: string;
  minBookingDays: number;
  maxBookingDays: number;
  highSeasonStart?: Date;
  highSeasonEnd?: Date;
  childrenFreeAgeLimit: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const BookingConfigSchema = new Schema<IBookingConfig>({
  _id: { type: String, default: 'main' },
  minBookingDays: { type: Number, default: 1, min: 1 },
  maxBookingDays: { type: Number, default: 30, min: 1 },
  highSeasonStart: { type: Date },
  highSeasonEnd: { type: Date },
  childrenFreeAgeLimit: { type: Number, default: 13 }
}, {
  timestamps: true,
  versionKey: false
});

export default mongoose.models.BookingConfig || mongoose.model<IBookingConfig>('BookingConfig', BookingConfigSchema);