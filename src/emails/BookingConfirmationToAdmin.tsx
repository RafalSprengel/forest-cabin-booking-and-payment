import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Section,
  Heading,
  Hr,
} from '@react-email/components';
import * as React from 'react';
import { ISiteSettings } from '../db/models/SiteSettings';

interface BookingConfirmationToAdminProps {
  customerName: string;
  orderNumber: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  paidAmount?: number;
  siteSettings: Partial<ISiteSettings>;
  guestPhone?: string;
  guestEmail?: string;
  guestAddress?: string;
  adults?: number;
  propertyName?: string;
  children?: number;
  extraBeds?: number;
  orderDate?: string;
  invoiceRequested?: boolean;
  companyName?: string;
  nip?: string;
  street?: string;
  city?: string;
  postalCode?: string;
  cabinsCount?: number;
  adminNotes?: string;
}

export default function BookingConfirmationToAdmin({
  customerName,
  orderNumber,
  checkIn,
  checkOut,
  totalPrice,
  paidAmount,
  siteSettings,
  guestPhone,
  guestEmail,
  guestAddress,
  propertyName,
  adults,
  children,
  extraBeds,
  orderDate,
  invoiceRequested,
  companyName,
  nip,
  street,
  city,
  postalCode,
  cabinsCount,
  adminNotes,
}: BookingConfirmationToAdminProps) {
  const mainStyle = {
    backgroundColor: '#f6f9fc',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
  };

  const containerStyle = {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '40px 20px',
    borderRadius: '8px',
    border: '1px solid #e6ebf1',
    maxWidth: '600px',
  };

  const headingStyle = {
    color: '#1a1a1a',
    fontSize: '24px',
    fontWeight: 'bold' as const,
    lineHeight: '1.2',
  };

  const badgeStyle = {
    display: 'inline-block' as const,
    backgroundColor: '#22c55e',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: 'bold' as const,
    padding: '4px 12px',
    borderRadius: '4px',
    marginBottom: '20px',
  };

  const textStyle = {
    fontSize: '16px',
    color: '#4d4d4d',
    lineHeight: '1.5',
  };

  const sectionStyle = {
    backgroundColor: '#f9f9f9',
    padding: '20px',
    borderRadius: '4px',
    margin: '20px 0',
  };

  const sectionTextStyle = {
    fontSize: '14px',
    margin: '8px 0',
    color: '#333',
  };

  const hrStyle = {
    borderColor: '#e6ebf1',
    margin: '15px 0',
  };

  const sumStyle = {
    fontSize: '18px',
    fontWeight: 'bold' as const,
    color: '#1a1a1a',
  };

  const footerTextStyle = {
    fontSize: '12px',
    color: '#8898aa',
    lineHeight: '1.4',
  };

  return (
    <Html>
      <Head />
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          <Text style={badgeStyle}>Nowa rezerwacja online</Text>
          <Heading style={headingStyle}>
            Wilcze Chatki — panel administracyjny
          </Heading>
          <Text style={textStyle}>
            Zarejestrowano nową rezerwację, która została pomyślnie opłacona online.
          </Text>

          <Section style={sectionStyle}>
            <Text style={sectionTextStyle}><strong>Gość:</strong> {customerName}</Text>
            {guestPhone && (
              <Text style={sectionTextStyle}><strong>Telefon gościa:</strong> {guestPhone}</Text>
            )}
            {guestEmail && (
              <Text style={sectionTextStyle}><strong>E-mail gościa:</strong> {guestEmail}</Text>
            )}
            {guestAddress && (
              <Text style={sectionTextStyle}><strong>Adres gościa:</strong> {guestAddress}</Text>
            )}
            {propertyName && (
              <Text style={sectionTextStyle}><strong>Obiekt:</strong> {propertyName}</Text>
            )}
            {(typeof cabinsCount !== 'undefined' && cabinsCount > 1) && (
              <Text style={sectionTextStyle}><strong>Ilość domków:</strong> {cabinsCount}</Text>
            )}
            {(typeof adults !== 'undefined') && (
              <Text style={sectionTextStyle}><strong>Dorosłych:</strong> {adults}</Text>
            )}
            {(typeof children !== 'undefined') && (
              <Text style={sectionTextStyle}><strong>Dzieci (bezpłatnie):</strong> {children}</Text>
            )}
            {(typeof extraBeds !== 'undefined') && (
              <Text style={sectionTextStyle}><strong>Dostawek:</strong> {extraBeds}</Text>
            )}
            {orderDate && (
              <Text style={sectionTextStyle}><strong>Data zamówienia:</strong> {orderDate}</Text>
            )}
            <Text style={sectionTextStyle}><strong>Nr zamówienia:</strong> {orderNumber}</Text>

            <Text style={sectionTextStyle}><strong>Zameldowanie:</strong> {checkIn}</Text>
            <Text style={sectionTextStyle}><strong>Wymeldowanie:</strong> {checkOut}</Text>
            {adminNotes && (
              <Text style={sectionTextStyle}><strong>Uwagi wewnętrzne:</strong> {adminNotes}</Text>
            )}

            <Text style={sectionTextStyle}><strong>Faktura VAT:</strong>{!invoiceRequested && ' Nie'}</Text>
            {invoiceRequested && (<>
              <Section style={{ padding: '10px', backgroundColor: '#fff' }}>
                {companyName && <Text style={sectionTextStyle}><strong>Nazwa firmy:</strong> {companyName}</Text>}
                {nip && <Text style={sectionTextStyle}><strong>NIP:</strong> {nip}</Text>}
                {street && <Text style={sectionTextStyle}><strong>Ulica:</strong> {street}</Text>}
                {postalCode && <Text style={sectionTextStyle}><strong>Kod pocztowy:</strong> {postalCode}</Text>}
                {city && <Text style={sectionTextStyle}><strong>Miasto:</strong> {city}</Text>}
              </Section>
            </>)}

            <Hr style={hrStyle} />
            {typeof paidAmount === 'number' && paidAmount !== totalPrice ? (
              <>
                <Text style={sumStyle}>Wpłacono: {Number(paidAmount).toFixed(2)} zł</Text>
                <Text style={sectionTextStyle}>Pozostało do zapłaty: {Number(totalPrice - paidAmount).toFixed(2)} zł</Text>
              </>
            ) : (
              <Text style={sumStyle}>Kwota: {Number(totalPrice).toFixed(2)} PLN</Text>
            )}

            <Hr style={hrStyle} />
          </Section>

          <Text style={footerTextStyle}>
            Ta wiadomość została wygenerowana automatycznie przez system rezerwacji Wilcze Chatki.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
