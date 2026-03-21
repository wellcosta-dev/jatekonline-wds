const AAM_VAT_CODE = "0_AAM";
const AAM_VAT_RATE_PERCENT = 0;

export const BUSINESS_VAT_CODE = AAM_VAT_CODE;
export const BUSINESS_VAT_RATE_PERCENT = AAM_VAT_RATE_PERCENT;

export function parseVatRatePercent(vatRate?: string): number {
  if (!vatRate) return BUSINESS_VAT_RATE_PERCENT;
  if (vatRate === AAM_VAT_CODE) return 0;
  const parsed = Number(vatRate.replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < 0) return BUSINESS_VAT_RATE_PERCENT;
  return parsed;
}

export function roundHuf(value: number): number {
  return Math.round(Number.isFinite(value) ? value : 0);
}

export function toNetPrice(grossPrice: number, vatRate?: string): number {
  const safeGross = Math.max(0, Number(grossPrice || 0));
  const percent = parseVatRatePercent(vatRate);
  if (percent <= 0) return roundHuf(safeGross);
  return roundHuf(safeGross / (1 + percent / 100));
}

export function toVatAmount(grossPrice: number, vatRate?: string): number {
  const safeGross = Math.max(0, Number(grossPrice || 0));
  const net = toNetPrice(safeGross, vatRate);
  return roundHuf(safeGross - net);
}
