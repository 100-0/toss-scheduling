import { HOUR_START } from './dates';
import type { DateStr, SlotIndex } from '../types';

export function cellKey(date: DateStr, slot: SlotIndex): string {
  return `${date}|${slot}`;
}

export function parseCellKey(key: string): { date: DateStr; slot: SlotIndex } {
  const [date, slot] = key.split('|');
  return { date, slot: Number(slot) };
}

export function slotToHour(slot: SlotIndex): number {
  return HOUR_START + slot * 0.5;
}

export function hourToSlot(hour: number): SlotIndex {
  return Math.round((hour - HOUR_START) * 2);
}

export interface Rect {
  dateStart: number; // index into columns array
  dateEnd: number;
  slotStart: SlotIndex;
  slotEnd: SlotIndex; // exclusive
}

export function normalizeRect(a: Rect): Rect {
  return {
    dateStart: Math.min(a.dateStart, a.dateEnd),
    dateEnd: Math.max(a.dateStart, a.dateEnd),
    slotStart: Math.min(a.slotStart, a.slotEnd),
    slotEnd: Math.max(a.slotStart, a.slotEnd),
  };
}
