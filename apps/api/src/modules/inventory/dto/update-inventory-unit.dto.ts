export class UpdateInventoryUnitDto {
  phaseId?: string | null;
  unitNumber?: string;
  unitType?: string;
  floor?: string;
  areaSqm?: number;
  bedrooms?: number;
  bathrooms?: number;
  finishing?: string;
  view?: string;
  basePrice?: number;
  currency?: string;
  pricePerSqm?: number;
  status?: string;
  visibility?: string;
  images?: string[];
  floorPlanUrl?: string;
  features?: Record<string, unknown>;
}
