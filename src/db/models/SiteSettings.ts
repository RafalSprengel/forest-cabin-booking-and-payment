import mongoose, { Schema, Document } from 'mongoose';

export interface ISiteSettingsDoc extends Omit<Document, '_id'> {
  _id: string;
  phone: string;
  email: string;
  facebookUrl: string;
  bankAccountNumber: string;
  sendBookingConfirmationEmails?: boolean;
  bookingNotificationsEmail?: string;
}

export type ISiteSettings = ISiteSettingsDoc;

const SiteSettingsSchema = new Schema<ISiteSettings>(
  {
    _id: {
      type: String,
      default: 'main'
    },
    phone: {
      type: String,
      required: true,
      default: '+48000000000'
    },
    email: {
      type: String,
      required: true,
      default: 'kontakt@example.com'
    },
    facebookUrl: {
      type: String,
      required: true,
      default: 'https://facebook.com'
    },
    bankAccountNumber: {
      type: String,
      required: true,
      default: '00 0000 0000 0000 0000 0000 0000'
    },
    sendBookingConfirmationEmails: {
      type: Boolean,
      required: true,
      default: true,
    },
    bookingNotificationsEmail: {
      type: String,
      default: ''
    }
  },
  {
    versionKey: false,
  }
);

const SiteSettings = mongoose.models.SiteSettings || mongoose.model<ISiteSettings>('SiteSettings', SiteSettingsSchema);

export default SiteSettings;
