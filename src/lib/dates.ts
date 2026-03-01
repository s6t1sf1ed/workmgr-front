function parseAsUTC(input: string | Date | null | undefined): Date | null {
  if (!input) return null;
  if (input instanceof Date) return input;
  if (/[zZ]|[+\-]\d{2}:\d{2}$/.test(input)) return new Date(input);
  return new Date(input + "Z"); // трактуем как UTC
}

const pad = (n: number) => n.toString().padStart(2, "0");

/* дата в русском формате: dd.MM.yyyy */
export function formatDateRu(input: string | Date | null | undefined): string {
  const d = parseAsUTC(input);
  if (!d || isNaN(d.getTime())) return "";
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
}

/* Дата + время в формате: dd.MM.yyyy HH:mm */
export function formatDateTimeRu(
  input: string | Date | null | undefined,
  needSeconds = false
): string {
  const d = parseAsUTC(input);
  if (!d || isNaN(d.getTime())) return "";
  const date = `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}${
    needSeconds ? `:${pad(d.getSeconds())}` : ""
  }`;
  return `${date} ${time}`;
}
