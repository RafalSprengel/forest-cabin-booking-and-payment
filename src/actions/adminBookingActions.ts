'use server'

import dbConnect from '@/db/connection';
import Booking from '@/db/models/Booking';
import Property from '@/db/models/Property';
import { revalidatePath } from 'next/cache';
import mongoose from 'mongoose';

export interface AdminBookingItem {
  _id: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  numberOfGuests: number;
  status: string;
  propertyName?: string;
  createdAt: string;
  bookingType?: string;
}

export async function getAdminBookingsList(): Promise<AdminBookingItem[]> {
  try {
    await dbConnect();
    
    const bookings = await Booking.find({})
      .sort({ startDate: 1 }) 
      .populate('propertyId', 'name') 
      .lean();

    return bookings.map(b => ({
      _id: b._id.toString(),
      guestName: b.guestName || 'Gość',
      guestEmail: b.guestEmail || '-',
      guestPhone: b.guestPhone || '-',
      startDate: b.startDate.toISOString().split('T')[0],
      endDate: b.endDate.toISOString().split('T')[0],
      totalPrice: b.totalPrice,
      numberOfGuests: b.numberOfGuests || 0,
      status: b.status,
      propertyName: (b.propertyId as any)?.name || 'Nieznany obiekt',
      createdAt: b.createdAt.toISOString(),
      bookingType: b.bookingType
    }));
  } catch (error) {
    console.error('Błąd pobierania listy rezerwacji:', error);
    return [];
  }
}

export async function getBookingById(id: string): Promise<AdminBookingItem | null> {
  try {
    await dbConnect();
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    const booking = await Booking.findById(id)
      .populate('propertyId', 'name')
      .lean();

    if (!booking) return null;

    return {
      _id: booking._id.toString(),
      guestName: booking.guestName || '',
      guestEmail: booking.guestEmail || '',
      guestPhone: booking.guestPhone || '',
      startDate: booking.startDate.toISOString().split('T')[0],
      endDate: booking.endDate.toISOString().split('T')[0],
      totalPrice: booking.totalPrice,
      numberOfGuests: booking.numberOfGuests || 0,
      status: booking.status,
      propertyName: (booking.propertyId as any)?.name || 'Nieznany obiekt',
      createdAt: booking.createdAt.toISOString(),
      bookingType: booking.bookingType
    };
  } catch (error) {
    console.error('Błąd pobierania rezerwacji:', error);
    return null;
  }
}

export async function updateBooking(id: string, data: any) {
  try {
    await dbConnect();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return { success: false, message: 'Nieprawidłowe ID rezerwacji' };
    }

    await Booking.findByIdAndUpdate(id, {
      ...data,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      updatedAt: new Date()
    });

    revalidatePath('/admin/bookings/list');
    revalidatePath(`/admin/bookings/list/${id}`);
    
    return { success: true, message: 'Zaktualizowano pomyślnie' };
  } catch (error) {
    console.error('Błąd aktualizacji rezerwacji:', error);
    return { success: false, message: 'Wystąpił błąd podczas aktualizacji' };
  }
}

export async function deleteBooking(id: string) {
  try {
    await dbConnect();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return { success: false, message: 'Nieprawidłowe ID' };
    }

    await Booking.findByIdAndDelete(id);

    revalidatePath('/admin/bookings/list');
    
    return { success: true, message: 'Usunięto pomyślnie' };
  } catch (error) {
    console.error('Błąd usuwania rezerwacji:', error);
    return { success: false, message: 'Wystąpił błąd podczas usuwania' };
  }
}