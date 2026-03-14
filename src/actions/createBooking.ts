'use server'
import dbConnect from '@/db/connection';
import Booking from '@/db/models/Booking';
import mongoose from 'mongoose';
interface CreateBookingParams {
  propertyId: string;
  startDate: string;
  endDate: string;
  guestName: string;
  guestEmail: string;
  totalPrice: number;
  paymentId: string;
  numberOfGuests?: number;
  extraBedsCount?: number;
}
export async function createBookingWithConditionalBlock({
  propertyId,
  startDate,
  endDate,
  guestName,
  guestEmail,
  totalPrice,
  paymentId,
  numberOfGuests = 0,
  extraBedsCount = 0
}: CreateBookingParams) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await dbConnect();
    const start = new Date(startDate);
    const end = new Date(endDate);
    const selectedPropId = new mongoose.Types.ObjectId(propertyId);
    const mainBooking = await Booking.create([{
      propertyId: selectedPropId,
      guestName,
      guestEmail,
      startDate: start,
      endDate: end,
      totalPrice,
      numberOfGuests,
      extraBedsCount,
      status: 'confirmed',
      bookingType: 'real',
      paymentId,
    }], { session });
    await session.commitTransaction();
    return {
      success: true,
      bookingId: mainBooking[0]._id,
      message: "Rezerwacja potwierdzona."
    };
  } catch (error) {
    await session.abortTransaction();
    console.error("Błąd tworzenia rezerwacji:", error);
    return { success: false, message: "Nie udało się dokończyć rezerwacji." };
  } finally {
    session.endSession();
  }
}