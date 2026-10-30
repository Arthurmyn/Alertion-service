export function shouldCloseDemo(key: string, dialogOpen: boolean): boolean {
  return key === 'Escape' && !dialogOpen;
}
