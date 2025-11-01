import { CalendarEvent } from './types';

export async function loadEvents(): Promise<CalendarEvent[]> {
  const result = await chrome.storage.local.get(['calendarEvents']);
  return result.calendarEvents || [];
}

export async function saveEvent(event: CalendarEvent): Promise<void> {
  const events = await loadEvents();
  const existingIndex = events.findIndex(e => e.id === event.id);
  
  if (existingIndex >= 0) {
    events[existingIndex] = event;
  } else {
    events.push(event);
  }
  
  await chrome.storage.local.set({ calendarEvents: events });
}

export async function deleteEvent(id: string): Promise<void> {
  const events = await loadEvents();
  const filtered = events.filter(e => e.id !== id);
  await chrome.storage.local.set({ calendarEvents: filtered });
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function getDateFromString(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00');
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return formatDate(date1) === formatDate(date2);
}

export function getEventsForDate(events: CalendarEvent[], date: Date): CalendarEvent[] {
  const dateStr = formatDate(date);
  return events.filter(e => e.date === dateStr);
}