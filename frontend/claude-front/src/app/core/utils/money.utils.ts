export function sumAmounts(items: readonly { amount: number }[]): number {
  return items.reduce((acc, item) => acc + Number(item.amount ?? 0), 0);
}
