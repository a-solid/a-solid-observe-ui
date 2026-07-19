import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge conditional class names; tailwind-merge dedupes Tailwind utilities when present. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
