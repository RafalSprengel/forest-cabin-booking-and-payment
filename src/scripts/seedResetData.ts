import dbConnect from '../db/connection';
import Booking from '../db/models/Booking';
import Property from '../db/models/Property';
import PropertyPrices from '../db/models/PropertyPrices';
import Season from '../db/models/Season';
import CustomPrice from '../db/models/CustomPrice';
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

async function clearCollections() {
  await Booking.deleteMany({});
  await PropertyPrices.deleteMany({});
  await Property.deleteMany({});
  await Season.deleteMany({});
  await CustomPrice.deleteMany({});
  await SystemConfig.deleteMany({});
  await BookingConfig.deleteMany({});
  await PriceConfig.deleteMany({});
}

async function seedDefaultSeasons() {
  const currentYear = new Date().getFullYear();

  const seasons = [
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

  return Season.insertMany(seasons);
}

async function seedDefaultProperties() {
  const properties = [
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

  return Property.insertMany(properties);
}

async function seedConfigDocuments() {
  await SystemConfig.create({
    _id: 'main',
    autoBlockOtherCabins: true,
  });

  await BookingConfig.create({
    _id: 'main',
    minBookingDays: 1,
    maxBookingDays: 30,
    childrenFreeAgeLimit: 13,
    allowCheckinOnDepartureDay: true,
    checkInHour: 15,
    checkOutHour: 12,
  });

  await PriceConfig.create({
    _id: 'main',
    seasons: [],
  });
}

async function seedPropertyPrices(properties: any[], seasons: any[]) {
  const docs: any[] = [];

  for (const property of properties) {
    docs.push({
      propertyId: property._id,
      seasonId: null,
      weekdayPrices: baseWeekdayPrices,
      weekendPrices: baseWeekendPrices,
      weekdayExtraBedPrice: 50,
      weekendExtraBedPrice: 70,
    });

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

      docs.push({
        propertyId: property._id,
        seasonId: season._id,
        weekdayPrices: applyMultiplier(baseWeekdayPrices, multiplier),
        weekendPrices: applyMultiplier(baseWeekendPrices, multiplier),
        weekdayExtraBedPrice,
        weekendExtraBedPrice,
      });
    }
  }

  return PropertyPrices.insertMany(docs);
}

async function seedSampleBookings(properties: any[]) {
  const today = new Date();

  const nextWeekStart = new Date(today);
  nextWeekStart.setDate(today.getDate() + 7);
  nextWeekStart.setHours(14, 0, 0, 0);

  const nextWeekEnd = new Date(nextWeekStart);
  nextWeekEnd.setDate(nextWeekStart.getDate() + 4);
  nextWeekEnd.setHours(11, 0, 0, 0);

  const twoWeeksStart = new Date(today);
  twoWeeksStart.setDate(today.getDate() + 21);
  twoWeeksStart.setHours(14, 0, 0, 0);

  const twoWeeksEnd = new Date(twoWeeksStart);
  twoWeeksEnd.setDate(twoWeeksStart.getDate() + 3);
  twoWeeksEnd.setHours(11, 0, 0, 0);

  const bookings = [
    {
      propertyId: properties[0]._id,
      startDate: nextWeekStart,
      endDate: nextWeekEnd,
      guestName: 'Jan Kowalski',
      guestEmail: 'jan.kowalski@example.com',
      guestPhone: '+48 123 456 789',
      guestAddress: 'ul. Przykładowa 1, 00-001 Warszawa',
      numberOfGuests: 4,
      extraBedsCount: 1,
      totalPrice: 3500,
      paidAmount: 500,
      status: 'confirmed',
      invoice: true,
      invoiceData: {
        companyName: 'Test Sp. z o.o.',
        nip: '1234567890',
        street: 'ul. Faktury 10',
        city: 'Warszawa',
        postalCode: '00-002',
      },
      customerNotes: 'Rezerwacja testowa dla chatki A',
      source: 'customer',
    },
    {
      propertyId: properties[1]._id,
      startDate: twoWeeksStart,
      endDate: twoWeeksEnd,
      guestName: 'Anna Nowak',
      guestEmail: 'anna.nowak@example.com',
      guestPhone: '+48 987 654 321',
      guestAddress: 'ul. Inna 5, 80-001 Gdańsk',
      numberOfGuests: 2,
      extraBedsCount: 0,
      totalPrice: 1800,
      paidAmount: 1800,
      status: 'confirmed',
      invoice: false,
      customerNotes: 'Prośba o ciszę nocną',
      source: 'customer',
    },
  ];

  return Booking.insertMany(bookings);
}

async function seedResetData() {
  await dbConnect();
  await clearCollections();

  const seasons = await seedDefaultSeasons();
  const properties = await seedDefaultProperties();
  const priceDocs = await seedPropertyPrices(properties as any[], seasons as any[]);

  await seedConfigDocuments();
  const bookingDocs = await seedSampleBookings(properties as any[]);

  return {
    properties: properties.length,
    seasons: seasons.length,
    propertyPrices: priceDocs.length,
    bookings: bookingDocs.length,
  };
}

seedResetData()
  .then((summary) => {
    console.log('Seed reset finished successfully.');
    console.log(summary);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed reset failed.');
    console.error(error);
    process.exit(1);
  });
