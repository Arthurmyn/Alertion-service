function formatMegabytes(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${text} МБ`;
}

export function storageCaption(usedMb: number, limitMb: number): string {
  return `${formatMegabytes(usedMb)} из ${formatMegabytes(limitMb)}`;
}
