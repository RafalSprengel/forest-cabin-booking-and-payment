'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

export async function createManualBooking(formData: FormData) {
  try {
    const startDate = new Date(formData.get('startDate') as string);
    const endDate = new Date(formData.get('endDate') as string);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error('Nieprawidłowy format daty.');
    }

    if (startDate >= endDate) {
      throw new Error('Data wyjazdu musi być późniejsza niż data przyjazdu.');
    }

    const newBooking = await prisma.booking.create({
      data: {
        startDate,
        endDate,
        propertyId: formData.get('propertyId') as string,
        numGuests: parseInt(formData.get('numGuests') as string, 10),
        guestName: formData.get('guestName') as string,
        guestEmail: formData.get('guestEmail') as string,
        guestPhone: formData.get('guestPhone') as string,
        totalPrice: parseFloat(formData.get('totalPrice') as string),
        status: 'CONFIRMED', // Ręczne rezerwacje są domyślnie potwierdzone
        paymentStatus: 'PAID', // Zakładamy, że płatność została przyjęta
        internalNotes: formData.get('internalNotes') as string | undefined,
        source: 'admin', // Źródło rezerwacji
      },
    });

    // Unieważnij cache dla powiązanych stron, aby odświeżyć dane
    revalidatePath('/admin/bookings/calendar');
    revalidatePath('/admin/bookings/list');
    revalidatePath('/admin/bookings/add'); // Wyczyść formularz

    return {
      success: true,
      message: `Pomyślnie dodano rezerwację (ID: ${newBooking.id})`,
    };

  } catch (error) {
    console.error('Błąd podczas tworzenia rezerwacji:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Wystąpił nieznany błąd.',
    };
  }
}
