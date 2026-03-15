'use server'

import dbConnect from '@/db/connection';
import BookingConfig from '@/db/models/BookingConfig';
import { revalidatePath } from 'next/cache';

async function ensureBookingConfigExists() {
  await dbConnect();
  const exists = await BookingConfig.findById('main');
  if (!exists) {
    await BookingConfig.create({ _id: 'main' });
  }
}

export async function getBookingConfig() {
  await ensureBookingConfigExists();
  const config = await BookingConfig.findById('main').lean();
  return {
    minBookingDays: config?.minBookingDays ?? 1,
    maxBookingDays: config?.maxBookingDays ?? 30,
    highSeasonStart: config?.highSeasonStart ?? null,
    highSeasonEnd: config?.highSeasonEnd ?? null,
    maxGuestsPerCabin: config?.maxGuestsPerCabin ?? 6,
    childrenFreeAgeLimit: config?.childrenFreeAgeLimit ?? 13
  };
}

export async function updateBookingConfig(formData: FormData) {
  try {
    await dbConnect();
    const minBookingDays = parseInt(formData.get('minBookingDays') as string) || 1;
    const maxBookingDays = parseInt(formData.get('maxBookingDays') as string) || 30;
    const maxGuestsPerCabin = parseInt(formData.get('maxGuestsPerCabin') as string) || 6;
    const childrenFreeAgeLimit = parseInt(formData.get('childrenFreeAgeLimit') as string) || 13;
    
    // Daty sezonu wysokiego – opcjonalne
    const highSeasonStartStr = formData.get('highSeasonStart') as string;
    const highSeasonEndStr = formData.get('highSeasonEnd') as string;
    const highSeasonStart = highSeasonStartStr ? new Date(highSeasonStartStr) : undefined;
    const highSeasonEnd = highSeasonEndStr ? new Date(highSeasonEndStr) : undefined;

    await BookingConfig.findByIdAndUpdate(
      'main',
      {
        minBookingDays,
        maxBookingDays,
        highSeasonStart,
        highSeasonEnd,
        maxGuestsPerCabin,
        childrenFreeAgeLimit
      },
      { upsert: true, new: true }
    );

    revalidatePath('/admin/settings/booking');
    return { success: true, message: 'Zapisano ustawienia rezerwacji.' };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Błąd zapisu.' };
  }
}