export class PublicVisitorEventDto {
  eventType!: string;
  projectSlug?: string;
  path!: string;
  searchQuery?: string;
  filters?: Record<string, unknown>;
  durationMs?: number;
  scrollDepth?: number;
  sectionId?: string;
  metadata?: Record<string, unknown>;
}

export class CreateVisitorEventsDto {
  visitorId!: string;
  sessionId!: string;
  events!: PublicVisitorEventDto[];
}
