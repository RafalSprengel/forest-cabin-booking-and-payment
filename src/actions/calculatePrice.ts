import dbConnect from '@/db/connection';
import Season from '@/db/models/Season';
import CustomPrice from '@/db/models/CustomPrice';
import Property from '@/db/models/Property';
import PropertyPrices from '@/db/models/PropertyPrices';

interface PriceBreakdown {
  nightlyPrices: {
    date: string;
    price: number;
    type: 'weekday' | 'weekend';
    seasonName?: string;
    source: 'custom' | 'season' | 'basic';
  }[];
  totalPrice: number;
  extraBedsTotal: number;
  summary: string;
}

interface IPriceTier {
  minGuests: number;
  maxGuests: number;
  price: number;
}

// export async function calculateDynamicPrice(
//   startDate: string,
//   endDate: string,
//   totalGuests: number,
//   extraBedsCount: number,
//   propertyId: string
// ): Promise<PriceBreakdown> {
//   await dbConnect();

//   const start = new Date(startDate);
//   const end = new Date(endDate);

//   const property = await Property.findById(propertyId);
//   if (!property) {
//     throw new Error('Nieruchomość nie została znaleziona w bazie danych.');
//   }

//   const seasons = await Season.find({ isActive: true });

//   // Pobieramy wszystkie ceny dla tego domku jednym zapytaniem
//   const allPropertyPrices = await PropertyPrices.find({ propertyId }).lean();

//   // seasonId === null → ceny podstawowe
//   const basicPrices = allPropertyPrices.find(
//     (p) => p.seasonId === null || p.seasonId === undefined
//   ) ?? null;

//   // Mapa seasonId (string) → rekord cen
//   const seasonPricesMap = new Map<string, (typeof allPropertyPrices)[0]>(
//     allPropertyPrices
//       .filter((p) => p.seasonId != null)
//       .map((p) => [p.seasonId!.toString(), p])
//   );

//   const nightlyPrices: PriceBreakdown['nightlyPrices'] = [];
//   let totalPrice = 0;
//   let totalExtraBedPrice = 0;

//   for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
//     const dateStr = d.toISOString().split('T')[0];
//     const currentDay = d.getDay();
//     const isWeekend = currentDay === 5 || currentDay === 6; // piątek, sobota

//     let nightPrice: number;
//     let source: 'custom' | 'season' | 'basic' = 'basic';
//     let seasonName: string | undefined;
//     let extraBedPrice: number;

//     // ── 1. CustomPrice (najwyższy priorytet) ─────────────────────────────────
//     const customPrice = await CustomPrice.findOne({
//       propertyId,
//       date: { $gte: d, $lt: new Date(d.getTime() + 86_400_000) },
//     });

//     if (customPrice) {
//       nightPrice = customPrice.price;
//       extraBedPrice = isWeekend
//         ? customPrice.weekendExtraBedPrice
//         : customPrice.weekdayExtraBedPrice;
//       source = 'custom';
//     } else {
//       // ── 2. Sprawdź aktywny sezon ───────────────────────────────────────────
//       const activeSeason = seasons.find(
//         (s) => d >= new Date(s.startDate) && d <= new Date(s.endDate)
//       );

//       if (activeSeason) {
//         const seasonPrices = seasonPricesMap.get(activeSeason._id.toString());

//         if (!seasonPrices) {
//           throw new Error(
//             `Brak cen dla sezonu "${activeSeason.name}" i domku "${property.name}". ` +
//               `Skonfiguruj ceny w panelu admina.`
//           );
//         }

//         const tiers = isWeekend
//           ? seasonPrices.weekendPrices
//           : seasonPrices.weekdayPrices;
//         const tier = findPriceTier(tiers as IPriceTier[], totalGuests);

//         if (!tier) {
//           throw new Error(
//             `Brak przedziału cenowego dla ${totalGuests} gości w sezonie "${activeSeason.name}"`
//           );
//         }

//         nightPrice = tier.price;
//         extraBedPrice = isWeekend
//           ? seasonPrices.weekendExtraBedPrice
//           : seasonPrices.weekdayExtraBedPrice;
//         seasonName = activeSeason.name;
//         source = 'season';
//       } else {
//         // ── 3. Ceny podstawowe (poza sezonem) ─────────────────────────────────
//         if (!basicPrices) {
//           throw new Error(
//             `Brak cen podstawowych dla domku "${property.name}". ` +
//               `Skonfiguruj ceny w panelu admina.`
//           );
//         }

//         const tiers = isWeekend
//           ? basicPrices.weekendPrices
//           : basicPrices.weekdayPrices;
//         const tier = findPriceTier(tiers as IPriceTier[], totalGuests);

//         if (!tier) {
//           throw new Error(
//             `Brak przedziału cenowego dla ${totalGuests} gości w cenach podstawowych`
//           );
//         }

//         nightPrice = tier.price;
//         extraBedPrice = isWeekend
//           ? basicPrices.weekendExtraBedPrice
//           : basicPrices.weekdayExtraBedPrice;
//         source = 'basic';
//       }
//     }

//     const finalNightPrice = nightPrice + extraBedsCount * extraBedPrice;

//     nightlyPrices.push({
//       date: dateStr,
//       price: finalNightPrice,
//       type: isWeekend ? 'weekend' : 'weekday',
//       seasonName,
//       source,
//     });

//     totalPrice += finalNightPrice;
//     totalExtraBedPrice += extraBedsCount * extraBedPrice;
//   }

//   return {
//     nightlyPrices,
//     totalPrice,
//     extraBedsTotal: totalExtraBedPrice,
//     summary: `${getNightsCount(start, end)} noclegów, ${totalGuests} gości, ${extraBedsCount} dostawek`,
//   };
// }

export async function calculateDynamicPrice(
  startDate: string,
  endDate: string,
  totalGuests: number,
  extraBedsCount: number,
  propertyId: string
): Promise<PriceBreakdown> {
  await dbConnect();
  const start = new Date(startDate);
  const end = new Date(endDate);

  const property = await Property.findById(propertyId);
  if (!property) {
    throw new Error('Nieruchomość nie została znaleziona w bazie danych.');
  }

  const seasons = await Season.find({ isActive: true });
  const allPropertyPrices = await PropertyPrices.find({ propertyId }).lean();

  // Ceny podstawowe (seasonId === null)
  const basicPrices = allPropertyPrices.find(
    (p) => p.seasonId === null || p.seasonId === undefined
  ) ?? null;

  // Mapa cen sezonowych
  const seasonPricesMap = new Map<string, (typeof allPropertyPrices)[0]>(
    allPropertyPrices
      .filter((p) => p.seasonId != null)
      .map((p) => [p.seasonId!.toString(), p])
  );

  const nightlyPrices: PriceBreakdown['nightlyPrices'] = [];
  let totalPrice = 0;
  let totalExtraBedPrice = 0;

  // 🔄 PĘTLA PO DATACH (zgodnie z flowchart)
  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const currentDay = d.getDay();
    const isWeekend = currentDay === 5 || currentDay === 6;

    let nightPrice: number;
    let source: 'custom' | 'season' | 'basic' = 'basic';
    let seasonName: string | undefined;
    let extraBedPrice: number;

    // ── 1. CustomPrice (Najwyższy priorytet) ──
    const customPrice = await CustomPrice.findOne({
      propertyId,
      date: { $gte: d, $lt: new Date(d.getTime() + 86_400_000) },
    });

    if (customPrice) {
      // Wybór przedziału z PriceTierSchema dla CustomDates
      const tiers = isWeekend
        ? customPrice.weekendPrices
        : customPrice.weekdayPrices;
      const tier = findPriceTier(tiers as IPriceTier[], totalGuests);

      if (!tier) {
        throw new Error(`Brak przedziału cenowego dla ${totalGuests} gości w cenie custom`);
      }

      nightPrice = tier.price;
      extraBedPrice = isWeekend
        ? customPrice.weekendExtraBedPrice
        : customPrice.weekdayExtraBedPrice;
      source = 'custom';
    } else {
      // ── 2. Sezon (tylko gdy jest wpis PropertyPrices dla seasonId)
      // ── 3. W przeciwnym razie → cennik podstawowy (brak sezonu dla daty lub brak cen sezonowych)
      const activeSeason = seasons.find(
        (s) => d >= new Date(s.startDate) && d <= new Date(s.endDate)
      );

      const seasonPrices =
        activeSeason &&
        seasonPricesMap.get(activeSeason._id.toString());

      if (seasonPrices) {
        const tiers = isWeekend
          ? seasonPrices.weekendPrices
          : seasonPrices.weekdayPrices;
        const tier = findPriceTier(tiers as IPriceTier[], totalGuests);

        if (!tier) {
          throw new Error(`Brak przedziału dla ${totalGuests} gości w sezonie "${activeSeason!.name}"`);
        }

        nightPrice = tier.price;
        extraBedPrice = isWeekend
          ? seasonPrices.weekendExtraBedPrice
          : seasonPrices.weekdayExtraBedPrice;
        seasonName = activeSeason!.name;
        source = 'season';
      } else {
        if (!basicPrices) {
          throw new Error(`Brak cen podstawowych dla domku "${property.name}"`);
        }

        const tiers = isWeekend
          ? basicPrices.weekendPrices
          : basicPrices.weekdayPrices;
        const tier = findPriceTier(tiers as IPriceTier[], totalGuests);

        if (!tier) {
          throw new Error(`Brak przedziału dla ${totalGuests} gości w cenach podstawowych`);
        }

        nightPrice = tier.price;
        extraBedPrice = isWeekend
          ? basicPrices.weekendExtraBedPrice
          : basicPrices.weekdayExtraBedPrice;
        source = 'basic';
      }
    }

    const finalNightPrice = nightPrice + extraBedsCount * extraBedPrice;
    nightlyPrices.push({
      date: dateStr,
      price: finalNightPrice,
      type: isWeekend ? 'weekend' : 'weekday',
      seasonName,
      source,
    });
    totalPrice += finalNightPrice;
    totalExtraBedPrice += extraBedsCount * extraBedPrice;
  }

  return {
    nightlyPrices,
    totalPrice,
    extraBedsTotal: totalExtraBedPrice,
    summary: `${getNightsCount(start, end)} noclegów, ${totalGuests} gości, ${extraBedsCount} dostawek`,
  };
}

// 🔍 Helper: Znajdowanie przedziału cenowego
function findPriceTier(
  tiers: IPriceTier[],
  guests: number
): IPriceTier | null {
  return (
    tiers.find((r) => guests >= r.minGuests && guests <= r.maxGuests) ??
    (tiers.length > 0 ? tiers[tiers.length - 1] : null)
  );
}

function getNightsCount(start: Date, end: Date): number {
  return Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}