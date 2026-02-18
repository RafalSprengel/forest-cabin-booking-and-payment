import mongoose from 'mongoose';

const PriceConfigSchema = new mongoose.Schema({
  seasonName: { 
    type: String, 
    required: true 
  },
  startDate: { 
    type: Date, 
    required: true 
  },
  endDate: { 
    type: Date, 
    required: true 
  },
  pricePerNightOneCabin: { 
    type: Number, 
    required: true 
  },
  pricePerNightTwoCabins: { 
    type: Number, 
    required: true 
  },
  minNights: { 
    type: Number, 
    default: 2 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

export default mongoose.models.PriceConfig || mongoose.model('PriceConfig', PriceConfigSchema);