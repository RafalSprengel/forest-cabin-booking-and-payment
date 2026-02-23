import mongoose, { Schema, Document } from 'mongoose';

export interface IProperty extends Document {
  name: string;
  description?: string;
  baseCapacity: number;
  maxCapacityWithExtra: number;
  isActive: boolean;
}

const PropertySchema = new Schema<IProperty>({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  description: { 
    type: String, 
    trim: true 
  },
  baseCapacity: { 
    type: Number, 
    required: true, 
    default: 4 
  },
  maxCapacityWithExtra: { 
    type: Number, 
    required: true, 
    default: 6 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

export default mongoose.models.Property || mongoose.model<IProperty>('Property', PropertySchema);