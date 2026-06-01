export class AddDealRoomParticipantDto {
  userId?: string;
  clientId?: string;
  organizationId?: string;
  role!: string;
  status?: string;
}
