import { Injectable } from '@nestjs/common';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class UserPreferencesService {
  constructor(private readonly prisma: PrismaService) {}

  getNavigation(user: AuthenticatedRequestUser) {
    return this.prisma.userNavigationPreference.findUnique({
      where: { userId: user.userId },
    });
  }

  saveNavigation(user: AuthenticatedRequestUser, input: any) {
    return this.prisma.userNavigationPreference.upsert({
      where: { userId: user.userId },
      create: {
        userId: user.userId,
        layout: input.layout ?? {},
        hiddenItems: Array.isArray(input.hiddenItems) ? input.hiddenItems : [],
        pinnedItems: Array.isArray(input.pinnedItems) ? input.pinnedItems : [],
      },
      update: {
        layout: input.layout ?? {},
        hiddenItems: Array.isArray(input.hiddenItems) ? input.hiddenItems : [],
        pinnedItems: Array.isArray(input.pinnedItems) ? input.pinnedItems : [],
      },
    });
  }

  async resetNavigation(user: AuthenticatedRequestUser) {
    await this.prisma.userNavigationPreference.deleteMany({
      where: { userId: user.userId },
    });
    return { reset: true };
  }

  getQuickAction(user: AuthenticatedRequestUser, widgetKey: string) {
    return this.prisma.userQuickActionPreference.findUnique({
      where: { userId_widgetKey: { userId: user.userId, widgetKey } },
    });
  }

  saveQuickAction(user: AuthenticatedRequestUser, widgetKey: string, input: any) {
    return this.prisma.userQuickActionPreference.upsert({
      where: { userId_widgetKey: { userId: user.userId, widgetKey } },
      create: {
        userId: user.userId,
        widgetKey,
        position: input.position ?? {},
        isCollapsed: input.isCollapsed ?? true,
        selectedActions: Array.isArray(input.selectedActions) ? input.selectedActions : [],
      },
      update: {
        position: input.position ?? {},
        isCollapsed: input.isCollapsed ?? true,
        selectedActions: Array.isArray(input.selectedActions) ? input.selectedActions : [],
      },
    });
  }

  async resetQuickAction(user: AuthenticatedRequestUser, widgetKey: string) {
    await this.prisma.userQuickActionPreference.deleteMany({
      where: { userId: user.userId, widgetKey },
    });
    return { reset: true };
  }
}
