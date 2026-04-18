"use server";

import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import { BookingData } from "@/types/booking";

export async function createCheckoutSession(bookingData: BookingData) {
  const amount = bookingData.selectedOption?.totalPrice;

  // Rygorystyczna walidacja kwoty przed wysłaniem do Stripe
  if (!amount || amount <= 0) {
    console.error("Błąd: Nieprawidłowa kwota rezerwacji:", amount);
    throw new Error("Nieprawidłowa kwota rezerwacji. Proszę spróbować ponownie.");
  }

  const headerList = await headers();
  const origin = headerList.get("origin");

  try {

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "blik", "p24"],
      line_items: [
        {
          price_data: {
            currency: "pln",
            product_data: {
              name: `Rezerwacja: ${bookingData.selectedOption?.displayName}`,
              description: `Pobyt od ${bookingData.startDate} do ${bookingData.endDate}`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      customer_email: bookingData.guestData.email,
      metadata: {
        startDate: bookingData.startDate,
        endDate: bookingData.endDate,
        propertyId: bookingData.selectedOption?.propertyId || "",
        guestEmail: bookingData.guestData.email,
        adults: bookingData.adults.toString(),
        children: bookingData.children.toString(),
        extraBeds: bookingData.extraBeds.toString(),
      },
      success_url: `${origin}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/booking/summary`,
    });

    return { url: session.url };
  } catch (error) {
    console.error('Błąd podczas tworzenia sesji checkout:', error);
    throw new Error("Wystąpił błąd podczas inicjowania płatności Stripe.");
  }
}