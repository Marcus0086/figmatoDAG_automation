import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const isRedFlash = (r: number, g: number, b: number, a: number) =>
  r > 150 && g < 80 && b < 80 && a > 128;

export { isRedFlash };
