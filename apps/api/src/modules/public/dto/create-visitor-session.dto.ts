export class CreateVisitorSessionDto {
  anonymousKey!: string;
  sessionKey!: string;
  projectSlug?: string;
  path?: string;
  brokerId?: string;
  brokerSlug?: string;
  brokerageSlug?: string;
  ref?: string;
  utm?: Record<string, unknown>;
}
