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
    childrenFreeAgeLimit: config?.childrenFreeAgeLimit ?? 13
  };
}

export async function updateBookingConfig(prevState: any, formData: FormData) {
  try {
    await dbConnect();
    const minBookingDays = parseInt(formData.get('minBookingDays') as string) || 1;
    const maxBookingDays = parseInt(formData.get('maxBookingDays') as string) || 30;
    const childrenFreeAgeLimit = parseInt(formData.get('childrenFreeAgeLimit') as string) || 13;

    await BookingConfig.findByIdAndUpdate(
      'main',
      {
        minBookingDays,
        maxBookingDays,
        childrenFreeAgeLimit
      },
      { upsert: true, new: true }
    );

    revalidatePath('/admin/settings/booking');
    return { success: true, message: 'Zapisano ustawienia rezerwacji.' };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Wystąpił błąd podczas zapisu.' };
  }
}