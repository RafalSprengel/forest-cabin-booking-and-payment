'use server'

import dbConnect from '@/db/connection';
import PriceConfig from '@/db/models/PriceConfig';
import CustomPrice from '@/db/models/CustomPrice';
import { revalidatePath } from 'next/cache';
import mongoose from 'mongoose';
import { normalizeDate } from '@/utils/normalizeDate';

interface PriceTier {
  minGuests: number;
  maxGuests: number;
  price: number;
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

export async function updateCustompriceForDate(data: CustomPriceUpdate) {
  try {
    await dbConnect();

    if (!data.propertyId) {
      return { success: false, message: 'Brak wymaganych danych zapisu.' };
    }
    if (!Array.isArray(data.dates) || data.dates.length === 0) {
      return { success: false, message: 'Brak wymaganych danych zapisu.' };
    }
    if (!Array.isArray(data.prices) || data.prices.length === 0) {
      return { success: false, message: 'Brak przedziałów cenowych do zapisania.' };
    }
    if (typeof data.extraBedPrice !== 'number') {
      return { success: false, message: 'Nieprawidłowa wartość extraBedPrice; oczekiwano liczby.' };
    }

    const normalizedDates = data.dates.map(normalizeDate);

    const operations = normalizedDates.map(date => ({
      updateOne: {
        filter: {
          propertyId: new mongoose.Types.ObjectId(data.propertyId),
          date,
        },
        update: {
          $set: {
            prices: data.prices,
            extraBedPrice: data.extraBedPrice,
          },
        },
        upsert: true,
      },
    }));

    await CustomPrice.bulkWrite(operations);
    revalidatePath('/admin/prices');
    revalidatePath('/', 'layout');

    return { success: true, message: 'Zapisano ceny dla zaznaczonych dni.' };
  } catch (error) {
    console.error('Błąd zapisu custom prices:', error);
    return { success: false, message: 'Błąd bazy danych.' };
  }
}

export async function deleteCustomPricesForDate(data: { propertyId: string; dates: string[] }) {
  try {
    await dbConnect();

    const normalizedDates = data.dates.map(normalizeDate);

    await CustomPrice.deleteMany({
      propertyId: new mongoose.Types.ObjectId(data.propertyId),
      date: { $in: normalizedDates },
    });

    revalidatePath('/admin/prices');
    revalidatePath('/', 'layout');

    return { success: true, message: 'Usunięto ceny indywidualne.' };
  } catch (error) {
    console.error('Błąd usuwania cen:', error);
    return { success: false, message: 'Błąd bazy danych.' };
  }
}

export async function getCustomPrices(propertyId: string): Promise<CustomPriceEntry[]> {
  try {
    await dbConnect();

    const prices = await CustomPrice.find({
      propertyId: new mongoose.Types.ObjectId(propertyId),
    })
      .sort({ date: 1 })
      .lean();

    return prices.map((p: any) => ({
      date: p.date,
      prices: p.prices ?? [],
      previewPrice: p.prices?.[0]?.price ?? 0,
      propertyId: p.propertyId.toString(),
      extraBedPrice: p.extraBedPrice,
    }));
  } catch (_error) {
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

