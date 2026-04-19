interface BookingOverlapFilter {
  startDate: { $lt: Date } | { $lte: Date };
  endDate: { $gt: Date } | { $gte: Date };
}

export function buildBookingOverlapFilter(
  startDate: Date,
  endDate: Date,
  allowCheckinOnDepartureDay: boolean
): BookingOverlapFilter {
  if (allowCheckinOnDepartureDay) {
    return {
      startDate: { $lt: endDate },
      endDate: { $gt: startDate },
    };
  }

  return {
    startDate: { $lte: endDate },
    endDate: { $gte: startDate },
  };
}
