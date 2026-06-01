export class CreateBrokerAccessRuleDto {
  projectId!: string;
  granteeType!: string;
  granteeId!: string;
  accessLevel!: string;
  expiresAt?: string | null;
}
