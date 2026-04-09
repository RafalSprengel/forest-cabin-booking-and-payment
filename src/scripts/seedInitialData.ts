import dbConnect from '../db/connection';
import Property from '../db/models/Property';
import PropertyPrices from '../db/models/PropertyPrices';
import Season from '../db/models/Season';
import SystemConfig from '../db/models/SystemConfig';
import BookingConfig from '../db/models/BookingConfig';
import PriceConfig from '../db/models/PriceConfig';

type PriceTier = { minGuests: number; maxGuests: number; price: number };

const baseWeekdayPrices: PriceTier[] = [
  { minGuests: 1, maxGuests: 3, price: 300 },
  { minGuests: 4, maxGuests: 5, price: 400 },
  { minGuests: 6, maxGuests: 10, price: 500 },
];

const baseWeekendPrices: PriceTier[] = [
  { minGuests: 1, maxGuests: 3, price: 400 },
  { minGuests: 4, maxGuests: 5, price: 500 },
  { minGuests: 6, maxGuests: 10, price: 600 },
];

function applyMultiplier(prices: PriceTier[], multiplier: number): PriceTier[] {
  return prices.map((tier) => ({
    ...tier,
    price: Math.round(tier.price * multiplier),
  }));
}

async function ensureSeasons() {
  const currentYear = new Date().getFullYear();

  const defaultSeasons = [
    {
      name: 'Sezon wysoki (wakacje letnie)',
      description: 'Ceny obowiązują w sezonie letnim - czerwiec, lipiec, sierpień',
      startDate: new Date(currentYear, 5, 1),
      endDate: new Date(currentYear, 7, 31),
      isActive: true,
      order: 3,
    },
    {
      name: 'Sezon świąteczno-noworoczny',
      description: 'Podwyższone ceny w okresie świąt Bożego Narodzenia i Nowego Roku',
      startDate: new Date(currentYear, 11, 20),
      endDate: new Date(currentYear + 1, 0, 5),
      isActive: true,
      order: 1,
    },
    {
      name: 'Sezon wiosenny',
      description: 'Sezon przejściowy wiosna',
      startDate: new Date(currentYear, 2, 1),
      endDate: new Date(currentYear, 4, 31),
      isActive: true,
      order: 2,
    },
  ];

  let createdCount = 0;

  for (const season of defaultSeasons) {
    const existing = await Season.findOne({ name: season.name }).select('_id').lean();
    if (!existing) {
      await Season.create(season);
      createdCount += 1;
    }
  }

  const seasons = await Season.find({}).lean();
  return { seasons, createdCount };
}

async function ensureProperties() {
  const defaultProperties = [
    {
      name: 'Chatka A (Wilcza)',
      slug: 'chatka-a',
      description: 'Przytulny domek z kominkiem, idealny dla par i małych rodzin.',
      baseCapacity: 6,
      maxExtraBeds: 2,
      images: ['/gallery/wnetrze1.webp', '/gallery/wnetrze2.webp'],
      isActive: true,
    },
    {
      name: 'Chatka B (Leśna)',
      slug: 'chatka-b',
      description: 'Domek z widokiem na las, wyposażony w saunę i jacuzzi.',
      baseCapacity: 6,
      maxExtraBeds: 2,
      images: ['/gallery/wnetrze4.webp', '/gallery/wnetrze5.webp'],
      isActive: true,
    },
  ];

  let createdCount = 0;

  for (const property of defaultProperties) {
    const existing = await Property.findOne({ slug: property.slug }).select('_id').lean();
    if (!existing) {
      await Property.create(property);
      createdCount += 1;
    }
  }

  const properties = await Property.find({}).lean();
  return { properties, createdCount };
}

async function ensureConfigDocuments() {
  await SystemConfig.findByIdAndUpdate(
    'main',
    {
      $setOnInsert: {
        _id: 'main',
        autoBlockOtherCabins: true,
      },
    },
    { upsert: true, new: false }
  );

  await BookingConfig.findByIdAndUpdate(
    'main',
    {
      $setOnInsert: {
        _id: 'main',
        minBookingDays: 1,
        maxBookingDays: 30,
        childrenFreeAgeLimit: 13,
        allowCheckinOnDepartureDay: true,
        checkInHour: 15,
        checkOutHour: 12,
      },
    },
    { upsert: true, new: false }
  );

  await PriceConfig.findByIdAndUpdate(
    'main',
    {
      $setOnInsert: {
        _id: 'main',
        seasons: [],
      },
    },
    { upsert: true, new: false }
  );
}

async function ensurePropertyPrices(properties: any[], seasons: any[]) {
  let createdBasePrices = 0;
  let createdSeasonPrices = 0;

  for (const property of properties) {
    const baseResult = await PropertyPrices.updateOne(
      { propertyId: property._id, seasonId: null },
      {
        $setOnInsert: {
          propertyId: property._id,
          seasonId: null,
          weekdayPrices: baseWeekdayPrices,
          weekendPrices: baseWeekendPrices,
          weekdayExtraBedPrice: 50,
          weekendExtraBedPrice: 70,
        },
      },
      { upsert: true }
    );

    if (baseResult.upsertedCount > 0) {
      createdBasePrices += 1;
    }

    for (const season of seasons) {
      let multiplier = 1;
      let weekdayExtraBedPrice = 50;
      let weekendExtraBedPrice = 70;

      if (season.name.includes('wakacje')) {
        multiplier = 1.6;
        weekdayExtraBedPrice = 60;
        weekendExtraBedPrice = 80;
      } else if (season.name.includes('świąteczno')) {
        multiplier = 1.45;
        weekdayExtraBedPrice = 55;
        weekendExtraBedPrice = 75;
      } else if (season.name.includes('wiosenny')) {
        multiplier = 1.1;
        weekdayExtraBedPrice = 50;
        weekendExtraBedPrice = 70;
      }

      const seasonResult = await PropertyPrices.updateOne(
        { propertyId: property._id, seasonId: season._id },
        {
          $setOnInsert: {
            propertyId: property._id,
            seasonId: season._id,
            weekdayPrices: applyMultiplier(baseWeekdayPrices, multiplier),
            weekendPrices: applyMultiplier(baseWeekendPrices, multiplier),
            weekdayExtraBedPrice,
            weekendExtraBedPrice,
          },
        },
        { upsert: true }
      );

      if (seasonResult.upsertedCount > 0) {
        createdSeasonPrices += 1;
      }
    }
  }

  return { createdBasePrices, createdSeasonPrices };
}

async function seedInitialData() {
  await dbConnect();

  await ensureConfigDocuments();

  const { seasons, createdCount: createdSeasons } = await ensureSeasons();
  const { properties, createdCount: createdProperties } = await ensureProperties();

  if (properties.length === 0) {
    throw new Error('Brak domków. Nie udało się przygotować danych startowych.');
  }

  const { createdBasePrices, createdSeasonPrices } = await ensurePropertyPrices(properties, seasons);

  const totalPrices = await PropertyPrices.countDocuments({});

  return {
    createdSeasons,
    createdProperties,
    createdBasePrices,
    createdSeasonPrices,
    totalProperties: properties.length,
    totalSeasons: seasons.length,
    totalPrices,
  };
}

seedInitialData()
  .then((summary) => {
    console.log('Seed initial data finished successfully.');
    console.log(summary);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed initial data failed.');
    console.error(error);
    process.exit(1);
  });
