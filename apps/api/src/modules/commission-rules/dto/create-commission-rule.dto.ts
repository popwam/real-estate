export class CreateCommissionRuleDto {
  projectId!: string;
  partyType!: string;
  targetOrganizationId?: string;
  targetUserId?: string;
  commissionType!: string;
  value!: number;
  currency?: string;
  isActive?: boolean;
  notes?: string;
}
