export class CreateLeadClaimDto {
  clientName!: string;
  phone!: string;
  projectId!: string;
  unitId?: string;
  source?: string;
  notes?: string;
}
