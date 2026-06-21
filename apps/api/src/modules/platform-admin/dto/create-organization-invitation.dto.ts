export class CreateOrganizationInvitationDto {
  email!: string;
  intendedRole!: string;
  expiresInHours?: number;
}
