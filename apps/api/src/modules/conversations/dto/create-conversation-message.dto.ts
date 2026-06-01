export class CreateConversationMessageDto {
  body!: string;
  type?: string;
  metadata?: Record<string, unknown>;
}
