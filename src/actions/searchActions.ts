'use server'

import dbConnect from '@/db/connection';
import Property from '@/db/models/Property';
import PropertyPrices from '@/db/models/PropertyPrices';
import Booking from '@/db/models/Booking';
import PriceConfig from '@/db/models/PriceConfig';
import Season, { ISeason } from '@/db/models/Season';
import CustomPrice from '@/db/models/CustomPrice';
import SystemConfig from '@/db/models/SystemConfig';
import { Types } from 'mongoose';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

dayjs.extend(isBetween);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

export interface SearchOption {
  type: 'single' | 'whole';
  displayName: string;
  totalPrice: number;
  maxGuests: number;
  maxExtraBeds: number;
  description: string;
}

interface SearchParams {
  startDate: string;
  endDate: string;
  guests: number;
  extraBeds?: number;
}

interface CalculateTotalPriceParams {
  startDate: string;
  endDate: string;
  guests: number;
  extraBeds?: number;
  propertySelection: string;
}

interface CalculateTotalPriceForWholeParams {
  startDate: string;
  endDate: string;
  guests: number;
  extraBeds?: number;
}

interface GetDailyPriceParams {
  date: dayjs.Dayjs;
  guests: number;
  extraBeds: number;
  propertyBaseCapacity: number;
  customPrices: Map<string, any>;
  activeSeasons: ISeason[];
  basicPrices: any | null;
  seasonPricesMap: Map<string, any>;
}

function findPriceTier(
  tiers: { minGuests: number; maxGuests: number; price: number }[] | undefined,
  guestCount: number
): { minGuests: number; maxGuests: number; price: number } | null {
  if (!tiers?.length) return null;
  return (
    tiers.find((r) => guestCount >= r.minGuests && guestCount <= r.maxGuests) ??
    tiers[tiers.length - 1]
  );
}

// ─── Pomocnicza funkcja kalkulacji ceny za jedną noc ─────────────────────────

async function getDailyPrice({
  date,
  guests,
  extraBeds,
  propertyBaseCapacity,
  customPrices,
  activeSeasons,
  basicPrices,
  seasonPricesMap,
}: GetDailyPriceParams): Promise<number> {
  const dateKey = date.format('YYYY-MM-DD');
  const customPrice = customPrices.get(dateKey);

  const day = date.day();
  const isWeekend = day === 5 || day === 6; // piątek i sobota
  const guestsForPricing = Math.min(guests, propertyBaseCapacity);

  // 1. CustomPrice (schema: tiery weekday/weekend — bez pola `price`)
  if (customPrice) {
    const tiers = isWeekend ? customPrice.weekendPrices : customPrice.weekdayPrices;
    const tier = findPriceTier(tiers, guestsForPricing);
    if (tier) {
      const bedPrice = isWeekend
        ? customPrice.weekendExtraBedPrice
        : customPrice.weekdayExtraBedPrice;
      return tier.price + extraBeds * (bedPrice ?? 0);
    }
  }

  // 2. Sezon — tylko gdy data wpada w zakres sezonu I jest wpis PropertyPrices dla tego seasonId
  // 3. W przeciwnym razie (brak sezonu dla daty albo brak cen sezonowych dla property) → cennik podstawowy
  const activeSeason = activeSeasons.find(
    (s) =>
      date.isSameOrAfter(dayjs(s.startDate), 'day') &&
      date.isSameOrBefore(dayjs(s.endDate), 'day')
  );

  const seasonPrices =
    activeSeason &&
    seasonPricesMap.get(String((activeSeason as { _id?: unknown })._id));

  let ratesSource: any[];
  let bedPrice: number;

  if (seasonPrices) {
    ratesSource = isWeekend ? seasonPrices.weekendPrices : seasonPrices.weekdayPrices;
    bedPrice = isWeekend
      ? seasonPrices.weekendExtraBedPrice
      : seasonPrices.weekdayExtraBedPrice;
  } else {
    if (!basicPrices) return 0;
    ratesSource = isWeekend ? basicPrices.weekendPrices : basicPrices.weekdayPrices;
    bedPrice = isWeekend
      ? basicPrices.weekendExtraBedPrice
      : basicPrices.weekdayExtraBedPrice;
  }

  const tier =
    ratesSource.find(
      (r: any) => guestsForPricing >= r.minGuests && guestsForPricing <= r.maxGuests
    ) ?? ratesSource[ratesSource.length - 1];

  if (!tier) return 0;
  return tier.price + extraBeds * bedPrice;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export async function getMaxTotalGuests() {
  try {
    await dbConnect();
    const properties = await Property.find({ isActive: true, type: 'single' });
    return properties.reduce((sum, prop) => sum + prop.baseCapacity, 0);
  } catch (error) {
    console.error('Błąd podczas pobierania maksymalnej pojemności:', error);
    return 12;
  }
}

// ─── Kalkulacja ceny dla pojedynczego domku ───────────────────────────────────

export async function calculateTotalPrice(
  params: CalculateTotalPriceParams
): Promise<number> {
  const { startDate, endDate, guests, extraBeds = 0, propertySelection } = params;
  if (!startDate || !endDate || !guests) return 0;

  await dbConnect();

  const [property, customPricesDocs, activeSeasons, allPropertyPrices] =
    await Promise.all([
      Property.findById(propertySelection),
      CustomPrice.find({
        propertyId: propertySelection,
        date: {
          $gte: dayjs(startDate).toDate(),
          $lt: dayjs(endDate).toDate(),
        },
      }),
      Season.find({
        isActive: true,
        startDate: { $lte: dayjs(endDate).toDate() },
        endDate: { $gte: dayjs(startDate).toDate() },
      }).sort({ startDate: 1 }),
      // Jedno zapytanie zamiast embedded lookup w Property
      PropertyPrices.find({ propertyId: propertySelection }).lean(),
    ]);

  if (!property) return 0;

  // Rozdziel na basicPrices i mapę sezonową
  const basicPrices =
    allPropertyPrices.find((p) => p.seasonId === null || p.seasonId === undefined) ??
    null;

  const seasonPricesMap = new Map<string, any>(
    allPropertyPrices
      .filter((p) => p.seasonId != null)
      .map((p) => [p.seasonId!.toString(), p])
  );

  const customPricesMap = new Map<string, any>(
    customPricesDocs.map((cp: any) => [dayjs(cp.date).format('YYYY-MM-DD'), cp])
  );

  let total = 0;
  let currentDate = dayjs(startDate);
  const end = dayjs(endDate);

  while (currentDate.isBefore(end, 'day')) {
    total += await getDailyPrice({
      date: currentDate,
      guests,
      extraBeds,
      propertyBaseCapacity: property.baseCapacity,
      customPrices: customPricesMap,
      activeSeasons: activeSeasons as ISeason[],
      basicPrices,
      seasonPricesMap,
    });
    currentDate = currentDate.add(1, 'day');
  }

  return total;
}

// ─── Kalkulacja ceny dla całej posesji (wszystkie domki) ─────────────────────

export async function calculateTotalPriceForWhole(
  params: CalculateTotalPriceForWholeParams
): Promise<number> {
  const { startDate, endDate, guests, extraBeds = 0 } = params;
  if (!startDate || !endDate || !guests) return 0;

  await dbConnect();

  const properties = await Property.find({ isActive: true, type: 'single' }).sort({
    name: 1,
  });
  if (properties.length === 0) return 0;

  const propertyIds = properties.map((p) => p._id);

  const [allCustomPrices, activeSeasons, allPropertyPrices] = await Promise.all([
    CustomPrice.find({
      propertyId: { $in: propertyIds },
      date: {
        $gte: dayjs(startDate).toDate(),
        $lt: dayjs(endDate).toDate(),
      },
    }),
    Season.find({
      isActive: true,
      startDate: { $lte: dayjs(endDate).toDate() },
      endDate: { $gte: dayjs(startDate).toDate() },
    }).sort({ startDate: 1 }),
    // Wszystkie ceny dla wszystkich domków jednym zapytaniem
    PropertyPrices.find({ propertyId: { $in: propertyIds } }).lean(),
  ]);

  // Grupuj custom ceny: propertyId → (date → rekord)
  const propertyCustomPrices = new Map<string, Map<string, any>>();
  for (const cp of allCustomPrices as any[]) {
    const pId = cp.propertyId.toString();
    if (!propertyCustomPrices.has(pId)) propertyCustomPrices.set(pId, new Map());
    propertyCustomPrices.get(pId)!.set(dayjs(cp.date).format('YYYY-MM-DD'), cp);
  }

  // Grupuj PropertyPrices: propertyId → { basicPrices, seasonPricesMap }
  const propertyPricesIndex = new Map<
    string,
    { basicPrices: any | null; seasonPricesMap: Map<string, any> }
  >();
  for (const pp of allPropertyPrices) {
    const pId = pp.propertyId.toString();
    if (!propertyPricesIndex.has(pId)) {
      propertyPricesIndex.set(pId, { basicPrices: null, seasonPricesMap: new Map() });
    }
    const entry = propertyPricesIndex.get(pId)!;
    if (pp.seasonId === null || pp.seasonId === undefined) {
      entry.basicPrices = pp;
    } else {
      entry.seasonPricesMap.set(pp.seasonId.toString(), pp);
    }
  }

  let total = 0;
  let remainingGuests = guests;
  let remainingExtraBeds = extraBeds;

  for (const property of properties) {
    const pId = property._id.toString();
    const guestsForThisCabin = Math.min(remainingGuests, property.baseCapacity);
    const extraBedsForThisCabin = Math.min(remainingExtraBeds, property.maxExtraBeds);

    const priceEntry = propertyPricesIndex.get(pId) ?? {
      basicPrices: null,
      seasonPricesMap: new Map(),
    };
    const customPricesMap =
      propertyCustomPrices.get(pId) ?? new Map<string, any>();

    let currentDate = dayjs(startDate);
    const end = dayjs(endDate);

    while (currentDate.isBefore(end, 'day')) {
      total += await getDailyPrice({
        date: currentDate,
        guests: guestsForThisCabin,
        extraBeds: extraBedsForThisCabin,
        propertyBaseCapacity: property.baseCapacity,
        customPrices: customPricesMap,
        activeSeasons: activeSeasons as ISeason[],
        basicPrices: priceEntry.basicPrices,
        seasonPricesMap: priceEntry.seasonPricesMap,
      });
      currentDate = currentDate.add(1, 'day');
    }

    remainingGuests -= guestsForThisCabin;
    remainingExtraBeds -= extraBedsForThisCabin;
  }

  return total;
}

// ─── Wyszukiwanie dostępności ─────────────────────────────────────────────────

export async function searchAction(params: SearchParams) {
  const { startDate, endDate, guests, extraBeds = 0 } = params;
  try {
    await dbConnect();
    const start = dayjs(startDate);
    const end = dayjs(endDate);

    const systemConfig = await SystemConfig.findById('main');
    const autoBlockOtherCabins = systemConfig?.autoBlockOtherCabins ?? true;

    const occupiedIds = await Booking.distinct('propertyId', {
      status: { $in: ['confirmed', 'blocked'] },
      startDate: { $lt: end },
      endDate: { $gt: start },
    });

    const isWholeAvailable = occupiedIds.length === 0;

    const availableProperties = await Property.find({
      isActive: true,
      type: 'single',
      _id: { $nin: occupiedIds },
      baseCapacity: { $gte: guests - extraBeds }
    }).select('-createdAt -updatedAt').sort({ name: 1 });

    if (availableProperties.length === 0) return [];
    // console.table(availableProperties.map(e=>e.name))

    const options: SearchOption[] = [];

    // const allConflictingBookings = await Booking.find({
    //   propertyId: { $in: availableProperties.map((p) => p._id) },
    //   status: { $in: ['confirmed', 'blocked'] },
    //   startDate: { $lt: end.toDate() },
    //   endDate: { $gt: start.toDate() },
    // });

    for (const prop of availableProperties) {
      if (guests > prop.baseCapacity + prop.maxExtraBeds) continue;

      // console.log('Zmienne wyszukiwania:', {
      //   startDate,
      //   endDate,
      //   guests,
      //   extraBeds,
      //   propertyName: prop.name,
      //   propertyId: prop._id.toString(),
      // });

        const price = await calculateTotalPrice({
          startDate,
          endDate,
          guests,
          extraBeds,
          propertySelection: prop._id.toString(),
        });

      options.push({
        type: 'single',
        displayName: prop.name,
        totalPrice: price,
        maxGuests: prop.baseCapacity,
        maxExtraBeds: prop.maxExtraBeds,
        description: prop.description || 'Wynajem pojedynczego domku.',
      });
    }

    // Opcja całej posesji
    const totalGuestsCapacity = availableProperties.reduce((sum, p) => sum + p.baseCapacity, 0);
    const totalExtraCapacity = availableProperties.reduce((sum, p) => sum + p.maxExtraBeds, 0);

    if (guests <= totalGuestsCapacity + totalExtraCapacity) {

      if (isWholeAvailable) {
        const wholeProperty = await Property.findOne({ type: 'whole' });
        if (wholeProperty) {
          const wholePrice = await calculateTotalPriceForWhole({
            startDate,
            endDate,
            guests,
            extraBeds,
          });
          options.push({
            type: 'whole',
            displayName: wholeProperty.name,
            totalPrice: wholePrice,
            maxGuests: totalGuestsCapacity,
            maxExtraBeds: totalExtraCapacity,
            description: wholeProperty.description ?? '',
          });
        }
      }
    }

    return options.sort((a, b) => {
      if (a.type === 'whole') return -1;
      if (b.type === 'whole') return 1;
      return a.displayName.localeCompare(b.displayName);
    });
  } catch (error) {
    console.error('Błąd wyszukiwania dostępności:', error);
    throw new Error('Nie udało się pobrać dostępnych terminów.');
  }
}