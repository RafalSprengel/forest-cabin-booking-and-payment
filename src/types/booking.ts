export interface InvoiceData {
  companyName: string;
  nip: string;
  street: string;
  city: string;
  postalCode: string;
}

export interface GuestData {
  firstName: string;
  lastName: string;
  address: string;
  email: string;
  phone: string;
  invoice: boolean;
  invoiceData?: InvoiceData;
  termsAccepted: boolean;
}

export interface BookingData {
  startDate: string;
  endDate: string;
  adults: number;
  children: number;
  extraBeds: number;
  selectedOption: {
    propertyId: string;
    displayName: string;
    totalPrice: number;
    maxGuests: number;
  } | null;
  guestData: GuestData;
  reservationId?: string;
}

