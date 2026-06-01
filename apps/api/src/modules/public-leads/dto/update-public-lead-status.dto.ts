export class UpdatePublicLeadStatusDto {
  status!: 'REVIEWED' | 'CONVERTED' | 'SPAM';
  note?: string;
}
