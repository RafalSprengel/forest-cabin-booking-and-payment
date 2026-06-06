export function getPaymentBadge(paymentStatus: string, paidAmount: number, totalPrice: number) {
  const isFullyPaidByAmount = totalPrice > 0 && paidAmount >= totalPrice;
  if (paymentStatus === 'paid' || isFullyPaidByAmount) {
    return { text: 'Opłacone', class: 'paymentPaid' };
  }

  if (paidAmount > 0) {
    return { text: 'Zaliczka', class: 'paymentDeposit' };
  }

  return { text: 'Nieopłacone', class: 'paymentUnpaid' };
}

export function formatGuestName(name: string) {
  if (!name) return 'Gość';
  const trimmed = name.trim();
  if (trimmed === trimmed.toUpperCase() || trimmed === trimmed.toLowerCase()) {
    return trimmed
      .toLowerCase()
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  return trimmed;
}

export function getStatusLabel(status?: string) {
  if (status === 'confirmed') return 'Potwierdzona';
  if (status === 'blocked') return 'Zablokowana';
  if (status === 'cancelled') return 'Anulowana';
  if (status === 'failed') return 'Odrzucona';
  return 'Oczekująca';
}
