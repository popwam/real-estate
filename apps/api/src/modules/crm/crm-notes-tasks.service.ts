import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CrmActivityType, CrmFollowUpTaskPriority, CrmFollowUpTaskStatus } from '@prisma/client';
import { isPlatformUser } from '../../common/organization-scope';
import { operationOrganizationWhere, requireOperationOrganizationId } from '../../common/operations-scope';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { PrismaService } from '../database/prisma.service';
import { CrmActivitiesService } from './crm-activities.service';
import { CrmLeadsService } from './crm-leads.service';

@Injectable()
export class CrmNotesTasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly leads: CrmLeadsService,
    private readonly activities: CrmActivitiesService,
  ) {}

  async listNotes(currentUser: AuthenticatedRequestUser) {
    this.assertNotesView(currentUser);
    return this.prisma.crmNote.findMany({
      where: operationOrganizationWhere(currentUser),
      include: this.noteInclude(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async listLeadNotes(crmLeadId: string, currentUser: AuthenticatedRequestUser) {
    this.assertNotesView(currentUser);
    await this.leads.findAccessibleLead(crmLeadId, currentUser);
    return this.prisma.crmNote.findMany({
      where: { crmLeadId },
      include: this.noteInclude(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async createNote(input: any, currentUser: AuthenticatedRequestUser, crmLeadId?: string) {
    this.assertNotesManage(currentUser);
    const organizationId = requireOperationOrganizationId(currentUser);
    const lead = crmLeadId
      ? await this.leads.findAccessibleLead(crmLeadId, currentUser)
      : input.crmLeadId
        ? await this.leads.findAccessibleLead(String(input.crmLeadId), currentUser)
        : null;
    const conversationId = this.optionalString(input.conversationId);
    if (conversationId) await this.assertAccessibleConversation(conversationId, currentUser);
    const body = this.requiredString(input.body, 'body', 4000);

    const note = await this.prisma.crmNote.create({
      data: {
        organizationId: lead?.organizationId ?? organizationId,
        crmLeadId: lead?.id,
        conversationId,
        authorUserId: currentUser.userId,
        body,
      },
      include: this.noteInclude(),
    });

    if (note.crmLeadId) {
      await this.activities.create({
        organizationId: note.organizationId,
        crmLeadId: note.crmLeadId,
        conversationId: note.conversationId,
        actorUserId: currentUser.userId,
        actorOrganizationId: currentUser.organizationId,
        actorRole: currentUser.role,
        type: CrmActivityType.NOTE_ADDED,
        title: 'CRM note added',
        body,
      });
    }

    return note;
  }

  async listTasks(currentUser: AuthenticatedRequestUser) {
    this.assertTasksView(currentUser);
    return this.prisma.crmFollowUpTask.findMany({
      where: operationOrganizationWhere(currentUser),
      include: this.taskInclude(),
      orderBy: [{ status: 'asc' }, { dueAt: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async createTask(input: any, currentUser: AuthenticatedRequestUser) {
    this.assertTasksManage(currentUser);
    const organizationId = requireOperationOrganizationId(currentUser);
    const lead = input.crmLeadId ? await this.leads.findAccessibleLead(String(input.crmLeadId), currentUser) : null;
    const title = this.requiredString(input.title, 'title', 240);
    const task = await this.prisma.crmFollowUpTask.create({
      data: {
        organizationId: lead?.organizationId ?? organizationId,
        crmLeadId: lead?.id,
        assignedToUserId: this.optionalString(input.assignedToUserId),
        title,
        dueAt: input.dueAt ? new Date(String(input.dueAt)) : undefined,
        priority: this.parsePriority(input.priority),
        createdByUserId: currentUser.userId,
      },
      include: this.taskInclude(),
    });

    if (task.crmLeadId) {
      await this.activities.create({
        organizationId: task.organizationId,
        crmLeadId: task.crmLeadId,
        actorUserId: currentUser.userId,
        actorOrganizationId: currentUser.organizationId,
        actorRole: currentUser.role,
        type: CrmActivityType.TASK_CREATED,
        title: 'CRM follow-up task created',
        body: task.title,
        metadata: { priority: task.priority, dueAt: task.dueAt },
      });
    }

    return task;
  }

  async updateTask(id: string, input: any, currentUser: AuthenticatedRequestUser) {
    this.assertTasksManage(currentUser);
    const task = await this.findTask(id, currentUser);
    return this.prisma.crmFollowUpTask.update({
      where: { id: task.id },
      data: {
        title: input.title === undefined ? undefined : this.requiredString(input.title, 'title', 240),
        assignedToUserId: input.assignedToUserId === undefined ? undefined : this.optionalString(input.assignedToUserId),
        dueAt: input.dueAt === undefined ? undefined : input.dueAt ? new Date(String(input.dueAt)) : null,
        status: input.status === undefined ? undefined : this.parseStatus(input.status),
        priority: input.priority === undefined ? undefined : this.parsePriority(input.priority),
      },
      include: this.taskInclude(),
    });
  }

  async completeTask(id: string, currentUser: AuthenticatedRequestUser) {
    this.assertTasksManage(currentUser);
    const task = await this.findTask(id, currentUser);
    const updated = await this.prisma.crmFollowUpTask.update({
      where: { id: task.id },
      data: { status: CrmFollowUpTaskStatus.DONE },
      include: this.taskInclude(),
    });
    if (updated.crmLeadId) {
      await this.activities.create({
        organizationId: updated.organizationId,
        crmLeadId: updated.crmLeadId,
        actorUserId: currentUser.userId,
        actorOrganizationId: currentUser.organizationId,
        actorRole: currentUser.role,
        type: CrmActivityType.TASK_COMPLETED,
        title: 'CRM follow-up task completed',
        body: updated.title,
      });
    }
    return updated;
  }

  private async findTask(id: string, currentUser: AuthenticatedRequestUser) {
    const task = await this.prisma.crmFollowUpTask.findFirst({
      where: { id, ...operationOrganizationWhere(currentUser) },
    });
    if (!task) throw new NotFoundException('CRM task not found.');
    return task;
  }

  private async assertAccessibleConversation(id: string, currentUser: AuthenticatedRequestUser) {
    const where = isPlatformUser(currentUser)
      ? { id }
      : { id, organizationId: requireOperationOrganizationId(currentUser) };
    const conversation = await this.prisma.conversation.findFirst({
      where,
    });
    if (!conversation) throw new ForbiddenException('Conversation scope violation.');
  }

  private noteInclude() {
    return { author: { select: { id: true, firstName: true, lastName: true, email: true } } };
  }

  private taskInclude() {
    return {
      crmLead: { select: { id: true, status: true, client: { select: { name: true, phoneLast4: true } } } },
      assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
      createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
    };
  }

  private assertNotesView(currentUser: AuthenticatedRequestUser) {
    this.assertAny(currentUser, ['crm.notes.view_own', 'crm.notes.manage_own']);
  }
  private assertNotesManage(currentUser: AuthenticatedRequestUser) {
    this.assertAny(currentUser, ['crm.notes.manage_own']);
  }
  private assertTasksView(currentUser: AuthenticatedRequestUser) {
    this.assertAny(currentUser, ['crm.tasks.view_own', 'crm.tasks.manage_own']);
  }
  private assertTasksManage(currentUser: AuthenticatedRequestUser) {
    this.assertAny(currentUser, ['crm.tasks.manage_own']);
  }
  private assertAny(currentUser: AuthenticatedRequestUser, permissions: string[]) {
    if (!permissions.some((permission) => currentUser.permissions?.includes(permission))) {
      throw new ForbiddenException(`Missing permission: ${permissions[0]}.`);
    }
  }
  private parsePriority(value: unknown) {
    return Object.values(CrmFollowUpTaskPriority).includes(value as CrmFollowUpTaskPriority)
      ? (value as CrmFollowUpTaskPriority)
      : CrmFollowUpTaskPriority.NORMAL;
  }
  private parseStatus(value: unknown) {
    if (!Object.values(CrmFollowUpTaskStatus).includes(value as CrmFollowUpTaskStatus)) {
      throw new BadRequestException('Task status is invalid.');
    }
    return value as CrmFollowUpTaskStatus;
  }
  private requiredString(value: unknown, field: string, max: number) {
    const text = this.optionalString(value);
    if (!text) throw new BadRequestException(`${field} is required.`);
    return text.slice(0, max);
  }
  private optionalString(value: unknown) {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }
}
