// utils/dateUtils.ts
import { startOfDay, endOfDay } from "date-fns";

export const toUTCDate = (dateStr: string): Date => {
  const date = new Date(dateStr);
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
};

export const toUTCStartOfDay = (dateStr: string): string => {
  const date = toUTCDate(dateStr);
  const startDate = startOfDay(date);
  return startDate.toISOString();
};

export const toUTCEndOfDay = (dateStr: string): string => {
  const date = toUTCDate(dateStr);
  const endDate = endOfDay(date);
  return endDate.toISOString();
};

export const formatDateForInput = (dateStr: string): string => {
  return dateStr.split("T")[0];
};

export const isDateOverlapping = (
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean => {
  const s1 = new Date(start1).getTime();
  const e1 = new Date(end1).getTime();
  const s2 = new Date(start2).getTime();
  const e2 = new Date(end2).getTime();
  return s1 <= e2 && e1 >= s2;
};
