export const reservationSlots: Record<string, number> = {
  "5:30 PM": 17.5,
  "6:00 PM": 18,
  "6:30 PM": 18.5,
  "7:00 PM": 19,
  "7:30 PM": 19.5,
  "8:00 PM": 20,
  "8:30 PM": 20.5,
  "9:00 PM": 21,
};

export function reservationTime(date: string, time: string) {
  const hours = reservationSlots[time];
  if (hours === undefined) return null;
  const startTime = new Date(`${date}T00:00:00`);
  startTime.setHours(Math.floor(hours), (hours % 1) * 60, 0, 0);
  return startTime;
}
