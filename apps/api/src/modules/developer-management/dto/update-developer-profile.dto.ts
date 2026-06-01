export class UpdateDeveloperProfileDto {
  yearsInMarket?: number;
  totalUnitsDelivered?: number;
  portfolioUrl?: string;
  reraRegistration?: string;
  nucaRegistration?: string;
  activeProjectsCount?: number;
  settings?: Record<string, unknown>;
}
