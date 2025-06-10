export const getIsoDateString = (date: Date): string => {
  return date.toISOString().split('T')[0];
}; 