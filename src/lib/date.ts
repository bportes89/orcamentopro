export function formatDateBR(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

export function calculateDueDate(startDate: Date, validityDays: number): Date {
  const dueDate = new Date(startDate);
  dueDate.setDate(dueDate.getDate() + validityDays);
  return dueDate;
}
