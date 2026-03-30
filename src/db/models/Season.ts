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

const SeasonSchema = new Schema<ISeason>(
  {
    name: { type: String, required: true },
    description: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// ── Kaskadowe usuwanie cen przy kasowaniu sezonu ───────────────────────────
// Działa niezależnie od tego jak wywołujesz delete (serwis / bezpośrednio),
// co eliminuje ryzyko pozostawienia osieroconych rekordów w PropertyPrices.

SeasonSchema.pre('findOneAndDelete', async function () {
  const season = await this.model.findOne(this.getFilter());
  if (season) {
    // Dynamiczny import żeby uniknąć circular dependency
    const PropertyPrices = mongoose.model('PropertyPrices');
    await PropertyPrices.deleteMany({ seasonId: season._id });
  }
});

SeasonSchema.pre('deleteOne', async function () {
  const season = await this.model.findOne(this.getFilter());
  if (season) {
    const PropertyPrices = mongoose.model('PropertyPrices');
    await PropertyPrices.deleteMany({ seasonId: season._id });
  }
});

SeasonSchema.pre('deleteMany', async function () {
  const seasons = await this.model.find(this.getFilter());
  if (seasons.length > 0) {
    const PropertyPrices = mongoose.model('PropertyPrices');
    const ids = seasons.map((s: any) => s._id);
    await PropertyPrices.deleteMany({ seasonId: { $in: ids } });
  }
});

export default mongoose.models.Season ||
  mongoose.model<ISeason>('Season', SeasonSchema);