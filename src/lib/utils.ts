import { type ClassValue, clsx } from "clsx";
import { differenceInDays, format, formatDistance, formatRelative, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { twMerge } from "tailwind-merge";

// Function to merge Class Names in Tailwind and React
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Function to pause execution for a specified duration in milliseconds
export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function fromObject<T extends object>(
  cls: new (...args: any[]) => T,
  obj: Partial<T>,
): T {
  const instance = new cls();
  return Object.assign(instance, obj);
}

export function generateGuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Function to obtain the QueryParams of a URL and place them in a Record
export function getQueryParams(
  search: string,
  params: string[],
): Record<string, string> {
  const urlParams = new URLSearchParams(search);
  const result: Record<string, string> = {};

  params.forEach((param) => {
    result[param] = urlParams.get(param) ?? "";
  });

  return result;
}

// Functions to format dates
export function df(
  dateString: string,
  withTime = false,
  limitDistance = 7,
): string {
  const date = parseISO(dateString);

  if (!date) return "Fecha invalida";

  const diffDays = differenceInDays(new Date(), date);
  const result =
    diffDays >= limitDistance
      ? withTime
        ? dateTimeShort(date)
        : dateShort(date)
      : dateDistance(date, new Date());

  //console.log(`dateLocalFormat: ${result}`);
  return result;
}

export function dateShort(
  date: string | number | Date | null | undefined,
): string {
  if (!date) {
    return "";
  }

  const result = format(date, "P", { locale: es });

  return result;
}

export function dateTimeShort(
  date: string | number | Date | null | undefined,
): string {
  if (!date) {
    return "";
  }

  const result = format(date, "P p", { locale: es });

  return result;
}

export function dateDistance(
  date: string | number | Date,
  to: string | number | Date,
): string {
  if (!date) {
    return "";
  }

  const result = formatDistance(date, to, { locale: es, addSuffix: true });

  //console.log(`dateFormatDistance: ${result}`);
  return result;
}

export function dateRelative(
  date: string | number | Date,
  baseDate: string | number | Date,
): string {
  if (!date) {
    return "";
  }

  const result = formatRelative(date, baseDate, { locale: es });

  //console.log(`dateFormatRelative: ${result}`);
  return result;
}

export function setToMidnight(date: Date): Date {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
}

export function formatDateToYYYYMMDD(date: Date): string {
  date = setToMidnight(date);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDateToDDMMYYYY(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

export function createDateWithoutTimezoneOffset(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function createDateWithStandarNoonTimezone(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

export function safeCapitalize(str: string) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function capitalizeFirstLetter(input: string): string {
  if (!input) return ""; // Manejar cadenas vacías
  return input.charAt(0).toUpperCase() + input.slice(1).toLowerCase();
}