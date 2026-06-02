import dayjs from "dayjs";

export function isDateInPast(date?: string | null) {
  if (!date) return false;
  return !dayjs(date).isAfter(dayjs(), "day");
}

export default isDateInPast;
