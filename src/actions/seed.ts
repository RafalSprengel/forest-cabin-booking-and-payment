'use server'

import dbConnect from '@/db/connection';
import Property from '@/db/models/Property';
import PropertyPrices from '@/db/models/PropertyPrices';
import Booking from '@/db/models/Booking';
import SystemConfig from '@/db/models/SystemConfig';
import BookingConfig from '@/db/models/BookingConfig';
import PriceConfig from '@/db/models/PriceConfig';
import Season from '@/db/models/Season';
import CustomPrice from '@/db/models/CustomPrice';
import SiteSettings from '@/db/models/SiteSettings';
import { Types } from 'mongoose';
import mongoose from 'mongoose';
import { getSiteSettings } from '@/actions/siteSettingsActions';
import { getAuth } from '@/lib/auth';
import { siteSettingsDefaults } from '@/lib/siteSettingsDefaults';

function toPlainObject(doc: any) {
  return JSON.parse(JSON.stringify(doc));
}

// ─────────────────────────────────────────────────────────────────────────────
// SEED
// ─────────────────────────────────────────────────────────────────────────────

export async function clearAllData() {
  try {
    await dbConnect();
    await Booking.deleteMany({});
    await Property.deleteMany({});
    await PropertyPrices.deleteMany({});
    await SystemConfig.deleteMany({});
    await BookingConfig.deleteMany({});
    await PriceConfig.deleteMany({});
    await Season.deleteMany({});
    await CustomPrice.deleteMany({});
    await SiteSettings.deleteMany({});

    const db = mongoose.connection.db;
    if (db) {
      await db.collection('user').deleteMany({});
      await db.collection('account').deleteMany({});
      await db.collection('session').deleteMany({});
      await db.collection('verification').deleteMany({});
    }

    return { success: true, message: 'Wszystkie dane zostały usunięte (w tym użytkownicy)' };
  } catch (error) {
    console.error('Błąd podczas czyszczenia danych:', error);
    return { success: false, error: 'Nie udało się usunąć danych' };
  }
}

export async function seedSeasons() {
  try {
    await dbConnect();
    const currentYear = new Date().getFullYear();

    const seasons = [
      {
        _id: new Types.ObjectId('6a0276c6b002180738334dda'),
        name: 'Sezon świąteczno-noworoczny',
        description: 'Podwyższone ceny w okresie Świąt Bożego Narodzenia i Nowego Roku.',
        startDate: new Date('2000-12-20T12:00:00.000Z'),
        endDate: new Date('2001-01-05T12:00:00.000Z'),
        isActive: true,
        order: 3,
        createdAt: new Date('2026-05-12T00:39:34.992Z'),
        updatedAt: new Date('2026-05-16T18:10:18.050Z'),
      },
      {
        _id: new Types.ObjectId('6a0276c6b002180738334ddb'),
        name: 'Sezon ferii zimowych',
        description: 'Ferie zimowe w północnej części Polski.',
        startDate: new Date('2000-01-15T12:00:00.000Z'),
        endDate: new Date('2000-02-29T12:00:00.000Z'),
        isActive: true,
        order: 0,
        createdAt: new Date('2026-05-12T00:39:34.992Z'),
        updatedAt: new Date('2026-05-16T18:09:49.581Z'),
      },
      {
        _id: new Types.ObjectId('6a0276c6b002180738334dd9'),
        name: 'Sezon wysoki (wakacje letnie)',
        description: 'Ceny obowiązują w sezonie letnim – czerwiec, lipiec, sierpień.',
        startDate: new Date('2000-06-01T12:00:00.000Z'),
        endDate: new Date('2000-08-31T12:00:00.000Z'),
        isActive: true,
        order: 3,
        createdAt: new Date('2026-05-12T00:39:34.992Z'),
        updatedAt: new Date('2026-05-12T01:13:05.556Z'),
      },
      {
        _id: new Types.ObjectId('6a027c2be997703cfd85a1d0'),
        name: 'Majówka',
        description: 'Długi weekend majowy.',
        startDate: new Date('2000-05-01T12:00:00.000Z'),
        endDate: new Date('2000-05-03T12:00:00.000Z'),
        isActive: true,
        order: 2,
        createdAt: new Date('2026-05-12T01:02:35.044Z'),
        updatedAt: new Date('2026-05-12T01:12:29.811Z'),
      },
    ];

    await Season.deleteMany({});
    const created = await Season.insertMany(seasons);
    return {
      success: true,
      message: `Utworzono ${created.length} sezonów`,
      data: created.map(toPlainObject),
    };
  } catch (error) {
    console.error('Błąd podczas seedowania sezonów:', error);
    return { success: false, error: 'Nie udało się utworzyć sezonów' };
  }
}

export async function seedProperties() {
  try {
    await dbConnect();

    const properties = [
      {
        _id: new Types.ObjectId('69d78477b191d7bb540f83e1'),
        name: 'Chatka A',
        slug: 'chatka-a',
        description: 'Przytulny domek z widokiem na las.',
        maxAdults: 6,
        maxChildren: 6,
        maxExtraBeds: 2,
        images: ['/gallery/wnetrze1.webp', '/gallery/wnetrze2.webp'],
        isActive: true,
        createdAt: new Date('2026-04-09T10:50:31.743Z'),
        updatedAt: new Date('2026-05-14T23:29:47.673Z'),
      },
      {
        _id: new Types.ObjectId('69d78477b191d7bb540f83e2'),
        name: 'Chatka B',
        slug: 'chatka-b',
        description: 'Przytulny domek z widokiem na las.',
        maxAdults: 6,
        maxChildren: 6,
        maxExtraBeds: 2,
        images: ['/gallery/wnetrze4.webp', '/gallery/wnetrze5.webp'],
        isActive: true,
        createdAt: new Date('2026-04-09T10:50:31.744Z'),
        updatedAt: new Date('2026-05-14T23:18:27.222Z'),
      },
    ];

    await Property.deleteMany({});
    const created = await Property.insertMany(properties);
    return {
      success: true,
      message: `Utworzono ${created.length} domków`,
      data: created.map(toPlainObject),
    };
  } catch (error) {
    console.error('Błąd podczas seedowania domków:', error);
    return { success: false, error: 'Nie udało się utworzyć domków' };
  }
}

/**
 * Seeduje kolekcję PropertyPrices.
 * Musi być wywołana PO seedProperties() i seedSeasons().
 */
export async function seedPropertyPrices() {
  try {
    await dbConnect();

    const properties = await Property.find({}).lean();

    if (properties.length === 0) {
      return { success: false, error: 'Najpierw uruchom seedProperties()' };
    }

    const pricesToInsert = [
      {
        _id: new Types.ObjectId('6a102b906289d1081775ae75'),
        propertyId: new Types.ObjectId('69d78477b191d7bb540f83e2'),
        seasonId: new Types.ObjectId('6a0276c6b002180738334dd9'),
        weekdayPrices: [
          { minGuests: 1, maxGuests: 3, price: 350 },
          { minGuests: 4, maxGuests: 6, price: 450 },
        ],
        weekendPrices: [
          { minGuests: 1, maxGuests: 3, price: 450 },
          { minGuests: 4, maxGuests: 6, price: 550 },
        ],
        weekdayExtraBedPrice: 100,
        weekendExtraBedPrice: 100,
        createdAt: new Date('2026-05-12T01:31:36.769Z'),
        updatedAt: new Date('2026-05-12T01:31:36.769Z'),
      },
      {
        _id: new Types.ObjectId('6a102b906289d1081775ae77'),
        propertyId: new Types.ObjectId('69d78477b191d7bb540f83e2'),
        seasonId: new Types.ObjectId('6a0276c6b002180738334dda'),
        weekdayPrices: [
          { minGuests: 1, maxGuests: 3, price: 500 },
          { minGuests: 4, maxGuests: 6, price: 600 },
        ],
        weekendPrices: [
          { minGuests: 1, maxGuests: 3, price: 600 },
          { minGuests: 4, maxGuests: 6, price: 700 },
        ],
        weekdayExtraBedPrice: 150,
        weekendExtraBedPrice: 150,
        createdAt: new Date('2026-05-12T01:34:12.214Z'),
        updatedAt: new Date('2026-05-12T01:34:12.214Z'),
      },
      {
        _id: new Types.ObjectId('6a102b906289d1081775ae79'),
        propertyId: new Types.ObjectId('69d78477b191d7bb540f83e2'),
        seasonId: new Types.ObjectId('6a0276c6b002180738334ddb'),
        weekdayPrices: [
          { minGuests: 1, maxGuests: 3, price: 400 },
          { minGuests: 4, maxGuests: 6, price: 500 },
        ],
        weekendPrices: [
          { minGuests: 1, maxGuests: 3, price: 500 },
          { minGuests: 4, maxGuests: 6, price: 600 },
        ],
        weekdayExtraBedPrice: 110,
        weekendExtraBedPrice: 110,
        createdAt: new Date('2026-05-12T01:28:37.827Z'),
        updatedAt: new Date('2026-05-12T01:28:37.827Z'),
      },
      {
        _id: new Types.ObjectId('6a102b906289d1081775ae7b'),
        propertyId: new Types.ObjectId('69d78477b191d7bb540f83e2'),
        seasonId: new Types.ObjectId('6a027c2be997703cfd85a1d0'),
        weekdayPrices: [
          { minGuests: 1, maxGuests: 3, price: 400 },
          { minGuests: 4, maxGuests: 6, price: 500 },
        ],
        weekendPrices: [
          { minGuests: 1, maxGuests: 3, price: 500 },
          { minGuests: 4, maxGuests: 6, price: 600 },
        ],
        weekdayExtraBedPrice: 110,
        weekendExtraBedPrice: 110,
        createdAt: new Date('2026-05-12T01:30:01.477Z'),
        updatedAt: new Date('2026-05-12T01:30:01.477Z'),
      },
    ];

    await PropertyPrices.deleteMany({});
    const created = await PropertyPrices.insertMany(pricesToInsert);

    return {
      success: true,
      message: `Utworzono ${created.length} rekordów cen w PropertyPrices`,
      data: created.map(toPlainObject),
    };
  } catch (error) {
    console.error('Błąd podczas seedowania cen:', error);
    return { success: false, error: 'Nie udało się utworzyć cen' };
  }
}

export async function seedPriceConfigDefaults() {
  try {
    await dbConnect();

    const defaultPriceConfig = {
      _id: 'main',
      defaultWeekdayPrices: [
        { minGuests: 2, maxGuests: 3, price: 300 },
        { minGuests: 4, maxGuests: 5, price: 400 },
        { minGuests: 6, maxGuests: 10, price: 500 },
      ],
      defaultWeekendPrices: [
        { minGuests: 2, maxGuests: 3, price: 400 },
        { minGuests: 4, maxGuests: 5, price: 500 },
        { minGuests: 6, maxGuests: 10, price: 600 },
      ],
      defaultWeekdayExtraBedPrice: 50,
      defaultWeekendExtraBedPrice: 70,
      childrenFreeAgeLimit: 13,
    };

    await PriceConfig.deleteMany({});
    const created = await PriceConfig.create(defaultPriceConfig);
    return {
      success: true,
      message: 'Domyślna konfiguracja cen została utworzona',
      data: toPlainObject(created),
    };
  } catch (error) {
    console.error('Błąd podczas seedowania konfiguracji cen:', error);
    return { success: false, error: 'Nie udało się utworzyć konfiguracji cen' };
  }
}

export async function seedSystemConfig() {
  try {
    await dbConnect();
    await SystemConfig.deleteMany({});
    const created = await SystemConfig.create({
      _id: 'main',
      autoBlockOtherCabins: false,
      lastOrderNumber: 50,
    });
    return {
      success: true,
      message: 'Konfiguracja systemowa została utworzona',
      data: toPlainObject(created),
    };
  } catch (error) {
    console.error('Błąd podczas seedowania konfiguracji systemowej:', error);
    return { success: false, error: 'Nie udało się utworzyć konfiguracji systemowej' };
  }
}

export async function seedSiteSettings() {
  try {
    await dbConnect();
    await SiteSettings.deleteMany({});
    const created = await SiteSettings.create({
      _id: 'main',
      phoneDisplay: '+48 503 420 551',
      phoneHref: '+48503420551',
      email: 'wilczechatki@gmail.com',
      facebookUrl: 'https://facebook.com/profile.php?id=61584455637648',
      bankAccountNumber: '20 1020 5226 0000 6702 0486 0336',
    });
    return {
      success: true,
      message: 'Ustawienia strony zostały utworzone',
      data: toPlainObject(created),
    };
  } catch (error) {
    console.error('Błąd podczas seedowania ustawień strony:', error);
    return { success: false, error: 'Nie udało się utworzyć ustawień strony' };
  }
}

export async function seedBookingConfig() {
  try {
    await dbConnect();
    await BookingConfig.deleteMany({});
    const created = await BookingConfig.create({
      _id: 'main',
      minBookingDays: 2,
      maxBookingDays: 30,
      childrenFreeAgeLimit: 13,
      allowCheckinOnDepartureDay: false,
      checkInHour: 15,
      checkOutHour: 12,
      createdAt: new Date('2026-04-09T10:50:32.119Z'),
      updatedAt: new Date('2026-05-16T19:07:42.466Z'),
    });
    return {
      success: true,
      message: 'Konfiguracja rezerwacji została utworzona',
      data: toPlainObject(created),
    };
  } catch (error) {
    console.error('Błąd podczas seedowania konfiguracji rezerwacji:', error);
    return { success: false, error: 'Nie udało się utworzyć konfiguracji rezerwacji' };
  }
}

export async function seedBookings() {
  try {
    await dbConnect();

    const properties = await Property.find({ isActive: true }).lean();
    if (properties.length < 2) {
      return { success: false, error: 'Najpierw utwórz minimum 2 domki' };
    }

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
        propertyId: new Types.ObjectId(properties[0]._id),
          startDate: nextWeekStart,
          endDate: nextWeekEnd,
          firstName: 'Jan',
          lastName: 'Kowalski',
          guestEmail: 'jan.kowalski@example.com',
        guestPhone: '+48 123 456 789',
        guestAddress: 'ul. Przykładowa 1, 00-001 Warszawa',
        adults: 4,
        children: 0,
        extraBedsCount: 1,
        totalPrice: 3500,
        depositAmount: 500,
        paidAmount: 500,
        paymentStatus: 'partial_paid',
        paymentMethod: 'transfer',
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
        source: 'online',
      },
      {
        propertyId: new Types.ObjectId(properties[1]._id),
          startDate: twoWeeksStart,
          endDate: twoWeeksEnd,
          firstName: 'Anna',
          lastName: 'Nowak',
          guestEmail: 'anna.nowak@example.com',
        guestPhone: '+48 987 654 321',
        guestAddress: 'ul. Inna 5, 80-001 Gdańsk',
        adults: 2,
        children: 0,
        extraBedsCount: 0,
        totalPrice: 1800,
        depositAmount: 1800,
        paidAmount: 1800,
        paymentStatus: 'paid',
        paymentMethod: 'transfer',
        status: 'confirmed',
        invoice: false,
        customerNotes: 'Prośba o ciszę nocną',
        source: 'online',
      },
    ];

    await Booking.deleteMany({});
    const created = await Booking.insertMany(bookings);
    return {
      success: true,
      message: `Utworzono ${created.length} rezerwacji`,
      data: created.map(toPlainObject),
    };
  } catch (error) {
    console.error('Błąd podczas seedowania rezerwacji:', error);
    return { success: false, error: 'Nie udało się utworzyć rezerwacji' };
  }
}

/**
 * Pełny reset bazy danych.
 * Kolejność ma znaczenie: sezony → domki → ceny (PropertyPrices) → reszta.
 */
export async function seedAllData() {
  try {
    await dbConnect();

    await clearAllData();

    // Kolejność jest ważna – PropertyPrices wymaga ID z Season i Property
    const seasons = await seedSeasons();
    if (!seasons.success) throw new Error(seasons.error);

    const props = await seedProperties();
    if (!props.success) throw new Error(props.error);

    const prices = await seedPropertyPrices();
    if (!prices.success) throw new Error(prices.error);

    const priceConfig = await seedPriceConfigDefaults();
    if (!priceConfig.success) throw new Error(priceConfig.error);

    const system = await seedSystemConfig();
    if (!system.success) throw new Error(system.error);

    const siteSettings = await seedSiteSettings();
    if (!siteSettings.success) throw new Error(siteSettings.error);

    const bookingConfig = await seedBookingConfig();
    if (!bookingConfig.success) throw new Error(bookingConfig.error);

    const bookings = await seedBookings();
    if (!bookings.success) throw new Error(bookings.error);

    return {
      success: true,
      message:
        'Wszystkie dane zostały zresetowane. ' +
        `Sezony: ${seasons.data?.length}, Domki: ${props.data?.length}, ` +
        `Rekordy cen: ${prices.data?.length}, Rezerwacje: ${bookings.data?.length}`,
    };
  } catch (error) {
    console.error('Błąd podczas seedowania wszystkich danych:', error);
    return { success: false, error: 'Nie udało się zresetować danych' };
  }
}

export async function seedAdmin() {
  const siteSettings = await getSiteSettings();
  const admins = [
    {
      email: siteSettings.email || siteSettingsDefaults.email,
      password: 'wilczki',
      name: 'Marika',
      username: 'Marika',
    },
  ];

  try {
    await dbConnect();
    const auth = await getAuth();

    const db = mongoose.connection.db;
    if (!db) throw new Error('Brak połączenia z MongoDB');

    // Usuwamy istniejących użytkowników o tych samych emailach/username'ach, aby uniknąć konfliktów
    const emails = admins.map(a => a.email);
    const usernames = admins.map(a => a.username);

    await db.collection('user').deleteMany({
      $or: [{ email: { $in: emails } }, { username: { $in: usernames } }]
    });
    await db.collection('account').deleteMany({});

    let createdCount = 0;

    for (const admin of admins) {
      await auth.api.signUpEmail({
        body: {
          email: admin.email,
          password: admin.password,
          name: admin.name,
        },
      });

      await db.collection('user').updateOne(
        { email: admin.email },
        {
          $set: {
            emailVerified: true,
            role: 'admin',
            username: admin.username.toLowerCase(),
            displayUsername: admin.username
          }
        }
      );

      createdCount++;
    }

    return {
      success: true,
      message: `Utworzono ${createdCount} administratorów za pomocą Better Auth.`,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Nieznany błąd';
    console.error('seedAdmin error:', error);
    return { success: false, error: message };
  }
}

export async function seedExactBetterAuthUser() {
  try {
    await dbConnect();
    const db = mongoose.connection.db;
    if (!db) throw new Error('Brak polaczenia z MongoDB');

    const userId = new Types.ObjectId('69fddb9a2e82f94116ef90c4');
    const accountId = new Types.ObjectId('69fddb9a2e82f94116ef90c5');

    await db.collection('user').deleteOne({ _id: userId });
    await db.collection('account').deleteOne({ _id: accountId });

    await db.collection('user').insertOne({
      _id: userId,
      name: 'Marika',
      email: 'test@gmail.com',
      emailVerified: true,
      role: 'admin',
      displayUsername: 'Marika',
      username: 'marika',
      createdAt: new Date('2026-05-08T12:48:26.232Z'),
      updatedAt: new Date('2026-05-16T19:30:58.008Z'),
    });

    await db.collection('account').insertOne({
      _id: accountId,
      accountId: '69fddb9a2e82f94116ef90c4',
      providerId: 'credential',
      userId,
      password: 'f439ddc539dd4312032f817049d1c38f:1f5448a74a5f3c971990eb9965e2ea16054847d49bc96454f406d7c2bc5071d7f561d4359739fe94483310ad7cf72a80b01589e90a0d6fa7db7b11758e67d8b9',
      createdAt: new Date('2026-05-08T12:48:26.268Z'),
      updatedAt: new Date('2026-05-08T12:48:26.268Z'),
    });

    return {
      success: true,
      message: 'Utworzono rekordy better-auth user i account.',
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Nieznany blad';
    console.error('seedExactBetterAuthUser error:', error);
    return {
      success: false,
      error: message,
    };
  }
}
