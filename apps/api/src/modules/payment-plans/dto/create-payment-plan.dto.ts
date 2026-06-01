export class CreatePaymentPlanDto {
  unitId?: string;
  scope?: string;
  name!: string;
  downPaymentPct?: number;
  installmentMonths?: number;
  installmentPct?: number;
  onDeliveryPct?: number;
  maintenanceFee?: number;
  isActive?: boolean;
  conditions?: Record<string, unknown>;
}
