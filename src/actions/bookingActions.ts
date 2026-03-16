'use server'

import dbConnect from '@/db/connection';
import Booking from '@/db/models/Booking';
import Property from '@/db/models/Property';
import SystemConfig from '@/db/models/SystemConfig';
import BookingConfig from '@/db/models/BookingConfig';
import { Types } from 'mongoose';

interface GuestData {
  firstName: string;
  lastName: string;
  address: string;
  email: string;
  phone: string;
  invoice: boolean;
  invoiceData?: {
    companyName: string;
    nip: string;
    street: string;
    city: string;
    postalCode: string;
  };
  termsAccepted: boolean;
}

interface SelectedOption {
  type: 'single' | 'whole';
  displayName: string;
  totalPrice: number;
}

interface BookingDraftData {
  startDate: string;
  endDate: string;
  adults: number;
  children: number;
  extraBeds: number;
  selectedOption: SelectedOption | null;
  guestData: GuestData;
}

export async function createBookingFromDraft(draftData: BookingDraftData) {
  try {
    await dbConnect();
    
    const { startDate, endDate, adults, children, extraBeds, selectedOption, guestData } = draftData;
    
    if (!selectedOption) {
      console.error('Brak selectedOption');
      return { success: false, error: 'Brak wybranego obiektu' };
    }
    
    if (!guestData.firstName || !guestData.lastName || !guestData.email || !guestData.phone) {
      console.error('Niekompletne dane gościa');
      return { success: false, error: 'Niekompletne dane gościa' };
    }
    
    const numberOfGuests = adults + children;
    const bookings = [];

    if (selectedOption.type === 'whole') {
      const properties = await Property.find({ isActive: true, type: 'single' }).sort({ name: 1 });
      
      if (properties.length === 0) {
        console.error('Brak aktywnych domków w bazie');
        return { success: false, error: 'Brak dostępnych domków' };
      }

      let remainingGuests = numberOfGuests;
      let remainingExtraBeds = extraBeds;
      const totalPricePerBooking = Number((selectedOption.totalPrice / properties.length).toFixed(2));

      for (let i = 0; i < properties.length; i++) {
        const property = properties[i];
        const guestsForThisCabin = Math.min(remainingGuests, property.baseCapacity);
        const extraBedsForThisCabin = Math.min(remainingExtraBeds, property.maxExtraBeds);

        bookings.push({
          propertyId: new Types.ObjectId(property._id.toString()),
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          guestName: `${guestData.firstName} ${guestData.lastName}`,
          guestEmail: guestData.email,
          guestPhone: guestData.phone,
          guestAddress: guestData.address,
          numberOfGuests: guestsForThisCabin,
          extraBedsCount: extraBedsForThisCabin,
          totalPrice: totalPricePerBooking,
          status: 'confirmed',
          bookingType: 'real',
          invoice: guestData.invoice,
          invoiceData: guestData.invoiceData,
          customerNotes: `Rezerwacja całej posesji`,
          source: 'customer',
          createdAt: new Date(),
          updatedAt: new Date()
        });

        remainingGuests -= guestsForThisCabin;
        remainingExtraBeds -= extraBedsForThisCabin;
      }
    } else {
      const property = await Property.findOne({ name: selectedOption.displayName, isActive: true }).select('_id');
      
      if (!property) {
        console.error('Nie znaleziono domku w bazie');
        return { success: false, error: 'Nie można znaleźć domku w bazie' };
      }

      bookings.push({
        propertyId: new Types.ObjectId(property._id.toString()),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        guestName: `${guestData.firstName} ${guestData.lastName}`,
        guestEmail: guestData.email,
        guestPhone: guestData.phone,
        guestAddress: guestData.address,
        numberOfGuests,
        extraBedsCount: extraBeds,
        totalPrice: selectedOption.totalPrice,
        status: 'confirmed',
        bookingType: 'real',
        invoice: guestData.invoice,
        invoiceData: guestData.invoiceData,
        customerNotes: '',
        source: 'customer',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    const savedBookings = await Booking.insertMany(bookings);
    
    return {
      success: true,
      message: 'Rezerwacja utworzona pomyślnie',
      bookingIds: savedBookings.map(b => b._id.toString())
    };
  } catch (error: any) {
    console.error('Błąd podczas tworzenia rezerwacji:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return { success: false, error: `Błąd walidacji: ${errors.join(', ')}` };
    }
    
    if (error.message && error.message.includes('Path') && error.message.includes('is not in schema')) {
      return { success: false, error: `Próba zapisu nieznanego pola: ${error.message}` };
    }
    
    return { success: false, error: 'Nie udało się utworzyć rezerwacji' };
  }
}

export async function getBlockedDates(): Promise<{ date: string }[]> {
  try {
    await dbConnect();

    // Pobierz konfigurację systemu i rezerwacji
    const [systemConfig, bookingConfig] = await Promise.all([
      SystemConfig.findById('main'),
      BookingConfig.findById('main')
    ]);

    const autoBlock = systemConfig?.autoBlockOtherCabins ?? true;

    // Jeśli autoBlock wyłączone, nie blokujemy żadnych dni w kalendarzu
    if (!autoBlock) {
      return [];
    }

    const allowCheckinOnDepartureDay = bookingConfig?.allowCheckinOnDepartureDay ?? true;

    // Pobierz wszystkie aktywne rezerwacje (potwierdzone i blokady systemowe)
    const bookings = await Booking.find({
      status: { $in: ['confirmed', 'blocked'] }
    }).select('startDate endDate').lean();

    const blockedSet = new Set<string>();

    for (const booking of bookings) {
      const start = new Date(booking.startDate);
      const end = new Date(booking.endDate);

      // Dni w pełni zajęte: od start+1 do end-1
      const firstFullDay = new Date(start);
      firstFullDay.setDate(firstFullDay.getDate() + 1);
      const lastFullDay = new Date(end);
      lastFullDay.setDate(lastFullDay.getDate() - 1);

      for (let d = new Date(firstFullDay); d <= lastFullDay; d.setDate(d.getDate() + 1)) {
        blockedSet.add(d.toISOString().split('T')[0]);
      }

      // Jeśli nie pozwalamy na zameldowanie w dniu wymeldowania, blokujemy dzień endDate
      if (!allowCheckinOnDepartureDay) {
        blockedSet.add(end.toISOString().split('T')[0]);
      }
    }

    // Konwertujemy na format oczekiwany przez CalendarPicker
    return Array.from(blockedSet).map(date => ({ date }));
  } catch (error) {
    console.error('Błąd podczas pobierania zablokowanych dat:', error);
    return [];
  }
}