'use server'

import dbConnect from '@/db/connection';
import PriceConfig from '@/db/models/PriceConfig';
import CustomPrice from '@/db/models/CustomPrice';
import { revalidatePath } from 'next/cache';
import mongoose from 'mongoose';
import dayjs from 'dayjs';

interface PriceTier {
  minGuests: number;
  maxGuests: number;
  price: number;
}

interface SeasonUpdate {
  seasonIndex: string; // "season0", "season1", etc.
  weekday: PriceTier[];
  weekend: PriceTier[];
  weekdayExtraBedPrice: number;
  weekendExtraBedPrice: number;
  childrenFreeAgeLimit: number;
}

interface CustomPriceUpdate {
  propertyId: string;
  dates: string[];
  prices: PriceTier[];
  extraBedPrice: number;
}

export interface CustomPriceEntry {
  date: string;
  prices: PriceTier[];
  previewPrice: number;
  propertyId: string;
  extraBedPrice?: number;
}

async function migrateLegacyCustomPrices(propertyId: string) {
  const docs = await CustomPrice.find({ propertyId }).lean();

  const operations = docs
    .filter((doc: any) => {
      const hasNewFields = Array.isArray(doc.prices);
      const hasLegacyFields = Array.isArray(doc.weekendPrices) || Array.isArray(doc.weekdayPrices);
      return !hasNewFields && hasLegacyFields;
    })
    .map((doc: any) => {
      const migratedPrices =
        (Array.isArray(doc.weekendPrices) && doc.weekendPrices.length > 0
          ? doc.weekendPrices
          : doc.weekdayPrices) ?? [];
      const migratedExtraBedPrice =
        doc.weekendExtraBedPrice ?? doc.weekdayExtraBedPrice ?? 50;

      return {
        updateOne: {
          filter: { _id: doc._id },
          update: {
            $set: {
              prices: migratedPrices,
              extraBedPrice: migratedExtraBedPrice,
              updatedAt: new Date(),
            },
            $unset: {
              weekdayPrices: '',
              weekendPrices: '',
              weekdayExtraBedPrice: '',
              weekendExtraBedPrice: '',
            },
          },
        },
      };
    });

  if (operations.length > 0) {
    await CustomPrice.bulkWrite(operations);
  }
}

export async function updatePriceConfig(prevState: any, formData: FormData) {
  try {
    await dbConnect();

    const seasonIndex = formData.get('seasonIndex') as string;
    const weekdayTiers = JSON.parse(formData.get('weekdayTiers') as string) as PriceTier[];
    const weekendTiers = JSON.parse(formData.get('weekendTiers') as string) as PriceTier[];
    const weekdayExtraBedPrice = parseInt(formData.get('weekdayExtraBedPrice') as string) || 50;
    const weekendExtraBedPrice = parseInt(formData.get('weekendExtraBedPrice') as string) || 70;
    const childrenFreeAgeLimit = parseInt(formData.get('childrenFreeAgeLimit') as string) || 13;

    const updateData: any = {};
    updateData[`${seasonIndex}.weekday`] = weekdayTiers;
    updateData[`${seasonIndex}.weekend`] = weekendTiers;
    updateData[`${seasonIndex}.weekdayExtraBedPrice`] = weekdayExtraBedPrice;
    updateData[`${seasonIndex}.weekendExtraBedPrice`] = weekendExtraBedPrice;
    updateData.childrenFreeAgeLimit = childrenFreeAgeLimit;

    await PriceConfig.findByIdAndUpdate(
      'main',
      { $set: updateData },
      { upsert: true, new: true }
    );

    revalidatePath('/admin/prices');
    return { success: true, message: `Zapisano konfigurację dla ${seasonIndex}.` };
  } catch (error) {
    console.error('Błąd zapisu cen:', error);
    return { success: false, message: 'Wystąpił błąd podczas zapisu.' };
  }
}


export async function updateCustompriceForDate(data: CustomPriceUpdate) {
  try {
    await dbConnect();

    const operations = data.dates.map(date => ({
      updateOne: {
        filter: {
          propertyId: new mongoose.Types.ObjectId(data.propertyId),
          date: dayjs(date).startOf('day').toDate() 
        },
        update: {
          $set: {
            prices: data.prices,
            extraBedPrice: data.extraBedPrice,
            updatedAt: new Date()
          },
          $unset: {
            weekdayPrices: '',
            weekendPrices: '',
            weekdayExtraBedPrice: '',
            weekendExtraBedPrice: '',
          },
        },
        upsert: true
      }
    }));

    await CustomPrice.bulkWrite(operations);
    revalidatePath('/admin/prices');
    
    return { success: true, message: `Zapisano ceny dla ${data.dates.length} dni.` };
  } catch (error) {
    return { success: false, message: 'Błąd bazy danych.' };
  }
}

export async function deleteCustomPricesForDate(data: { propertyId: string; dates: string[] }) {
  try {
    await dbConnect();

    const datesAsDates = data.dates.map(date => dayjs(date).startOf('day').toDate());

    await CustomPrice.deleteMany({
      propertyId: new mongoose.Types.ObjectId(data.propertyId),
      date: { $in: datesAsDates }
    });

    revalidatePath('/admin/prices');
    
    return { success: true, message: `Przywrócono ceny sezonowe dla ${data.dates.length} dni.` };
  } catch (error) {
    console.error('Błąd usuwania cen:', error);
    return { success: false, message: 'Błąd bazy danych podczas usuwania.' };
  }
}

export async function getCustomPrices(propertyId: string): Promise<CustomPriceEntry[]> {
  try {
    await dbConnect();
    await migrateLegacyCustomPrices(propertyId);
    const prices = await CustomPrice.find({ propertyId }).sort({ date: 1 }).lean();

    return prices.map((p: any) => ({
      date: dayjs(p.date).format('YYYY-MM-DD'),
      prices: p.prices ?? [],
      previewPrice:
        p.prices?.[0]?.price ??
        p.price ??
        0,
      propertyId: p.propertyId.toString(),
      extraBedPrice: p.extraBedPrice,
    }));
  } catch (error) {
    return [];
  }
}

export async function getPriceConfig() {
  try {
    await dbConnect();
    const config = await PriceConfig.findById('main').lean();
    if (!config) return null;
    return JSON.parse(JSON.stringify(config));
  } catch (error) {
    console.error('Błąd pobierania konfiguracji cen:', error);
    return null;
  }
}