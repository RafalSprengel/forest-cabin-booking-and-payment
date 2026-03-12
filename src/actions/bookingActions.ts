'use server'
import dbConnect from '@/db/connection';
import Booking from '@/db/models/Booking';
import Property from '@/db/models/Property';
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
  type: 'single' | 'double';
  displayName: string;
  totalPrice: number;
  maxGuests: number;
  propertyIds?: string[];
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
    
    let propertyIds = selectedOption.propertyIds || [];
    
    if (propertyIds.length === 0) {
      if (selectedOption.type === 'double') {
        const properties = await Property.find({ isActive: true }).select('_id');
        propertyIds = properties.map(p => p._id.toString());
      } else {
        const property = await Property.findOne({ name: selectedOption.displayName }).select('_id');
        if (property) {
          propertyIds = [property._id.toString()];
        }
      }
    }
    
    if (propertyIds.length === 0) {
      console.error('Nie znaleziono domków w bazie');
      return { success: false, error: 'Nie można znaleźć domku w bazie' };
    }
    
    if (selectedOption.type === 'double') {
      const baseExtraBedsPerCabin = Math.floor(extraBeds / propertyIds.length);
      const remainingExtraBeds = extraBeds % propertyIds.length;
      
      for (let i = 0; i < propertyIds.length; i++) {
        const extraBedsForThisCabin = baseExtraBedsPerCabin + (i < remainingExtraBeds ? 1 : 0);
        const guestsPerCabin = Math.ceil(numberOfGuests / propertyIds.length);
        
        bookings.push({
          propertyId: new Types.ObjectId(propertyIds[i]),
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          guestName: `${guestData.firstName} ${guestData.lastName}`,
          guestEmail: guestData.email,
          guestPhone: guestData.phone,
          guestAddress: guestData.address,
          numberOfGuests: guestsPerCabin,
          extraBedsCount: extraBedsForThisCabin,
          totalPrice: Number((selectedOption.totalPrice / propertyIds.length).toFixed(2)),
          status: 'confirmed',
          bookingType: 'real',
          invoice: guestData.invoice,
          invoiceData: guestData.invoiceData,
          customerNotes: `Rezerwacja całej posesji. Dzieci: ${children}`,
          source: 'customer',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    } else {
      bookings.push({
        propertyId: new Types.ObjectId(propertyIds[0]),
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
        customerNotes: `Dzieci: ${children}`,
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