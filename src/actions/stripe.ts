"use server";

import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import { BookingData } from "@/types/booking";

export async function createCheckoutSession(bookingData: BookingData) {
  if (!bookingData) throw new Error("Brak danych rezerwacji.");

  const { startDate, endDate, clientData, orders } = bookingData;

  if (
    !startDate ||
    !endDate ||
    !clientData?.firstName ||
    !clientData?.lastName ||
    !clientData?.email ||
    !Array.isArray(orders) ||
    orders.length === 0
  ) {
    throw new Error("Niekompletne dane rezerwacji.");
  }

  const amount = orders.reduce((sum, item) => sum + item.price, 0);
  const propertyIds = orders.map((order) => order.propertyId).join(',');
  const orderDisplayName = orders.length === 1
    ? orders[0].displayName || "Domek"
    : `${orders.length} obiekty`;
  const totalGuests = orders.reduce((sum, item) => sum + item.guests, 0);
  const totalExtraBeds = orders.reduce((sum, item) => sum + item.extraBeds, 0);

  if (amount <= 0) {
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
              name: `Rezerwacja: ${orderDisplayName}`,
              description: `Pobyt od ${startDate} do ${endDate}`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      customer_email: clientData.email,
      metadata: {
        startDate: startDate,
        endDate: endDate,
        propertyIds,
        guestEmail: clientData.email,
        guests: totalGuests.toString(),
        extraBeds: totalExtraBeds.toString(),
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