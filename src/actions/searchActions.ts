'use server'

import dbConnect from '@/db/connection';
import Property, { IProperty } from '@/db/models/Property';
import Booking from '@/db/models/Booking';
import PriceConfig from '@/db/models/PriceConfig';
import { Types } from 'mongoose';

export interface SearchOption {
  type: 'single' | 'double';
  propertyIds: string[];
  displayName: string;
  totalPrice: number;
  maxGuests: number;
  description: string;
  available: true; // Zawsze true, bo filtrujemy tylko dostępne
}

interface SearchParams {
  startDate: string;
  endDate: string;
  guests: number;
  extraBeds?: number;
}

/**
 * Pomocnicza funkcja do liczenia ceny na podstawie PriceConfig
 * (Uproszczona wersja - w produkcji warto wydzielić to do utils)
 */
async function calculateTotalPrice(
  startDate: string,
  endDate: string,
  guests: number,
  extraBeds: number,
  isDouble: boolean = false
): Promise<number> {
  await dbConnect();
  const config = await PriceConfig.findById('main');
  
  if (!config) {
    // Fallback jeśli brak konfiguracji (ceny bazowe z pamięci)
    return 0; 
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  let total = 0;

  // Jeśli to rezerwacja podwójna ("Całość"), dzielimy gości na dwa domki do celów wyceny
  // Zakładamy równomierny podział dla uproszczenia logiki progów cenowych
  const guestsPerCabin = isDouble ? Math.ceil(guests / 2) : guests;
  const extraBedsPerCabin = isDouble ? Math.ceil(extraBeds / 2) : extraBeds;

  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    const day = d.getDay();
    const isWeekend = (day === 5 || day === 6);
    
    // Sprawdź sezon
    const activeSeason = config.seasons.find(s => 
      s.isActive && d >= s.startDate && d <= s.endDate
    );

    const ratesSource = activeSeason || config.baseRates;
    const bedPrice = activeSeason?.extraBedPrice ?? config.baseRates.extraBedPrice;

    // Dobierz próg cenowy
    const tierKey = isWeekend ? 'weekend' : 'weekday';
    const tier = ratesSource[tierKey].find(r => 
      guestsPerCabin >= r.minGuests && guestsPerCabin <= r.maxGuests
    ) || ratesSource[tierKey][ratesSource[tierKey].length - 1];

    // Cena za jeden domek tej nocy
    const nightPrice = tier.price + (extraBedsPerCabin * bedPrice);

    // Jeśli to całość, mnożymy cenę x2 (bo są dwa domki)
    total += isDouble ? nightPrice * 2 : nightPrice;
  }

  return total;
}

export async function searchAvailableProperties({ 
  startDate, 
  endDate, 
  guests, 
  extraBeds = 0 
}: SearchParams): Promise<SearchOption[]> {
  try {
    await dbConnect();

    const start = new Date(startDate);
    const end = new Date(endDate);

    //Pobierz wszystkie aktywne domki
    const properties = await Property.find({ isActive: true });
    
    if (properties.length === 0) return [];

    const propertyIds = properties.map(p => p._id.toString());

    // Znajdź WSZYSTKIE kolizje w tym terminie
    // Uwzględniamy status 'confirmed' oraz 'blocked' (shadow bookings)
    // Algorytm: (StartIstn <= KoniecNowy) AND (KoniecIstn >= StartNowy)
    const conflictingBookings = await Booking.find({
      propertyId: { $in: propertyIds.map(id => new Types.ObjectId(id)) },
      status: { $in: ['confirmed', 'blocked'] },
      startDate: { $lte: end },
      endDate: { $gte: start }
    }).select('propertyId');

    // Zbiór ID zajętych domków
    const bookedPropertyIds = new Set(
      conflictingBookings.map(b => b.propertyId.toString())
    );

    const options: SearchOption[] = [];

    // Generuj opcje pojedyncze
    for (const prop of properties) {
      const isBooked = bookedPropertyIds.has(prop._id.toString());
      
      if (!isBooked) {
        const price = await calculateTotalPrice(startDate, endDate, guests, extraBeds, false);
        
        options.push({
          type: 'single',
          propertyIds: [prop._id.toString()],
          displayName: prop.name,
          totalPrice: price,
          maxGuests: prop.baseCapacity + (prop.maxCapacityWithExtra - prop.baseCapacity), // Uproszczenie
          description: "Wynajem pojedynczego domku. Dostęp do wspólnego terenu.",
          available: true
        });
      }
    }

    // Generuj opcję "Cała Posesja" (tylko jeśli WSZYSTKIE domki są wolne)
    // Sprawdzamy czy żaden z naszych domków nie jest na liście zajętych
    const allFree = properties.every(p => !bookedPropertyIds.has(p._id.toString()));

    if (allFree && properties.length > 1) {
      const price = await calculateTotalPrice(startDate, endDate, guests, extraBeds, true);
      
      options.push({
        type: 'double',
        propertyIds: properties.map(p => p._id.toString()),
        displayName: "Cała Posesja (Wszystkie domki)",
        totalPrice: price,
        maxGuests: properties.reduce((sum, p) => sum + p.baseCapacity, 0),
        description: "Maksymalna prywatność. Cały obiekt i teren tylko dla Twojej grupy.",
        available: true
      });
    }

    // Sortowanie: Najpierw "Cała Posesja", potem pojedyncze malejąco po cenie lub alfabetycznie
    return options.sort((a, b) => {
      if (a.type === 'double') return -1;
      if (b.type === 'double') return 1;
      return b.totalPrice - a.totalPrice;
    });

  } catch (error) {
    console.error("Błąd wyszukiwania dostępności:", error);
    throw new Error("Nie udało się pobrać dostępnych terminów.");
  }
}