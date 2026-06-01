export class CreateDealRoomMessageDto {
  messageType?: string;
  body!: string;
  metadata?: Record<string, unknown>;
}
