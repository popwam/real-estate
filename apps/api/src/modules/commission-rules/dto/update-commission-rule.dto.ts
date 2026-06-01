export class UpdateCommissionRuleDto {
  partyType?: string;
  targetOrganizationId?: string | null;
  targetUserId?: string | null;
  commissionType?: string;
  value?: number;
  currency?: string;
  isActive?: boolean;
  notes?: string | null;
}
