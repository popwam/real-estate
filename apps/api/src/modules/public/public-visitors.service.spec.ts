import { LeadAssignmentType, ProjectSellingMode, VisitorAttributionType } from '@prisma/client';
import { PublicVisitorsService } from './public-visitors.service';

describe('PublicVisitorsService lead assignment', () => {
  const project = {
    id: 'project-1',
    developerId: 'developer-1',
    sellingMode: ProjectSellingMode.AUTHORIZED_BROKERS,
  };

  function service(session: Record<string, unknown> | null, authorization: unknown = null) {
    const prisma = {
      publicVisitorSession: {
        findFirst: jest.fn().mockResolvedValue(session),
        update: jest.fn().mockReturnValue({}),
      },
      projectBrokerAuthorization: { findFirst: jest.fn().mockResolvedValue(authorization) },
      user: { findFirst: jest.fn().mockResolvedValue(null) },
      organization: { findFirst: jest.fn().mockResolvedValue(null) },
      publicVisitorEvent: { createMany: jest.fn().mockReturnValue({}) },
      publicVisitor: { update: jest.fn().mockReturnValue({}) },
      project: { findMany: jest.fn().mockResolvedValue([]) },
      $transaction: jest.fn().mockResolvedValue([]),
    };
    return { service: new PublicVisitorsService(prisma as any), prisma };
  }

  it('keeps OWNER_ONLY leads with the company', async () => {
    const { service: subject } = service({
      id: 'session-1',
      visitorId: 'visitor-1',
      projectId: project.id,
      firstTouchType: VisitorAttributionType.BROKER,
      firstTouchBrokerUserId: 'broker-1',
      firstTouchOrganizationId: 'brokerage-1',
    });
    const result = await subject.resolveLeadAssignment('visitor-1', 'session-1', {
      ...project,
      sellingMode: ProjectSellingMode.OWNER_ONLY,
    });
    expect(result.assignmentType).toBe(LeadAssignmentType.COMPANY);
    expect(result.assignmentReason).toBe('OWNER_ONLY_MODE');
  });

  it('assigns an authorized broker first touch', async () => {
    const { service: subject } = service({
      id: 'session-1',
      visitorId: 'visitor-1',
      projectId: project.id,
      firstTouchType: VisitorAttributionType.BROKER,
      firstTouchBrokerUserId: 'broker-1',
      firstTouchOrganizationId: 'brokerage-1',
      firstTouchSource: { brokerId: 'broker-1' },
      lastTouchSource: { brokerId: 'broker-1' },
    }, { id: 'authorization-1' });
    const result = await subject.resolveLeadAssignment('visitor-1', 'session-1', project);
    expect(result.assignmentType).toBe(LeadAssignmentType.BROKER);
    expect(result.assignedBrokerUserId).toBe('broker-1');
    expect(result.assignmentReason).toBe('AUTHORIZED_BROKER_FIRST_TOUCH');
  });

  it('does not allow a broker to replace company first touch', async () => {
    const { service: subject, prisma } = service({
      id: 'session-1',
      visitorId: 'visitor-1',
      projectId: project.id,
      firstTouchType: VisitorAttributionType.COMPANY,
      firstTouchOrganizationId: project.developerId,
    }, { id: 'authorization-1' });
    const result = await subject.resolveLeadAssignment('visitor-1', 'session-1', project);
    expect(result.assignmentType).toBe(LeadAssignmentType.COMPANY);
    expect(result.assignmentReason).toBe('COMPANY_FIRST_TOUCH');
    expect(prisma.projectBrokerAuthorization.findFirst).not.toHaveBeenCalled();
  });

  it('ignores unauthorized broker attribution', async () => {
    const { service: subject } = service({
      id: 'session-1',
      visitorId: 'visitor-1',
      projectId: project.id,
      firstTouchType: VisitorAttributionType.BROKER,
      firstTouchBrokerUserId: 'broker-2',
      firstTouchOrganizationId: 'brokerage-2',
    });
    const result = await subject.resolveLeadAssignment('visitor-1', 'session-1', project);
    expect(result.assignmentType).toBe(LeadAssignmentType.COMPANY);
    expect(result.assignmentReason).toBe('UNAUTHORIZED_OR_UNKNOWN_ATTRIBUTION');
  });

  it('validates and batches visitor events', async () => {
    const { service: subject, prisma } = service({
      id: 'session-1',
      visitorId: 'visitor-1',
      projectId: project.id,
    });
    const result = await subject.createEvents({
      visitorId: 'visitor-1',
      sessionId: 'session-1',
      events: [{ eventType: 'SCROLL_DEPTH', path: '/projects/demo', scrollDepth: 75 }],
    });
    expect(result).toEqual({ accepted: 1 });
    expect(prisma.publicVisitorEvent.createMany).toHaveBeenCalled();
  });
});
