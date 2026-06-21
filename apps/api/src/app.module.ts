import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RequestLoggingMiddleware } from './common/request-logging.middleware';
import { RateLimitModule } from './common/rate-limit/rate-limit.module';
import { EnvModule } from './config/env.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { AuthModule } from './modules/auth/auth.module';
import { BrokerProfilesModule } from './modules/broker-profiles/broker-profiles.module';
import { BrokerAccessModule } from './modules/broker-access/broker-access.module';
import { BrokerageManagementModule } from './modules/brokerage-management/brokerage-management.module';
import { ClientsModule } from './modules/clients/clients.module';
import { CommissionRulesModule } from './modules/commission-rules/commission-rules.module';
import { CommissionsModule } from './modules/commissions/commissions.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { CrmModule } from './modules/crm/crm.module';
import { DatabaseModule } from './modules/database/database.module';
import { DealRoomsModule } from './modules/deal-rooms/deal-rooms.module';
import { DealsModule } from './modules/deals/deals.module';
import { DeveloperManagementModule } from './modules/developer-management/developer-management.module';
import { DeveloperBrokerageAgreementsModule } from './modules/developer-brokerage-agreements/developer-brokerage-agreements.module';
import { FilesModule } from './modules/files/files.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { ImportExportModule } from './modules/import-export/import-export.module';
import { InvitationsModule } from './modules/invitations/invitations.module';
import { LeadClaimsModule } from './modules/lead-claims/lead-claims.module';
import { LeadsModule } from './modules/leads/leads.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { OrganizationVerificationsModule } from './modules/organization-verifications/organization-verifications.module';
import { OrganizationDomainsModule } from './modules/organization-domains/organization-domains.module';
import { OrganizationWebsiteSettingsModule } from './modules/organization-website-settings/organization-website-settings.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { OperationsModule } from './modules/operations/operations.module';
import { PaymentPlansModule } from './modules/payment-plans/payment-plans.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { PlatformAdminModule } from './modules/platform-admin/platform-admin.module';
import { PublicModule } from './modules/public/public.module';
import { PublicLeadsModule } from './modules/public-leads/public-leads.module';
import { ProjectPhasesModule } from './modules/project-phases/project-phases.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { RolesModule } from './modules/roles/roles.module';
import { ReservationRequestsModule } from './modules/reservation-requests/reservation-requests.module';
import { UnitAvailabilityModule } from './modules/unit-availability/unit-availability.module';
import { UsersModule } from './modules/users/users.module';
import { VisibilityRulesModule } from './modules/visibility-rules/visibility-rules.module';

@Module({
  imports: [
    EnvModule,
    RateLimitModule,
    DatabaseModule,
    AuthModule,
    OrganizationsModule,
    OrganizationVerificationsModule,
    OrganizationDomainsModule,
    OperationsModule,
    OrganizationWebsiteSettingsModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    AuditLogsModule,
    FilesModule,
    ClientsModule,
    LeadsModule,
    DeveloperManagementModule,
    BrokerageManagementModule,
    BrokerProfilesModule,
    ProjectsModule,
    ProjectPhasesModule,
    InventoryModule,
    ImportExportModule,
    InvitationsModule,
    UnitAvailabilityModule,
    PaymentPlansModule,
    VisibilityRulesModule,
    BrokerAccessModule,
    DeveloperBrokerageAgreementsModule,
    MarketplaceModule,
    LeadClaimsModule,
    ReservationRequestsModule,
    DealRoomsModule,
    DealsModule,
    CommissionRulesModule,
    CommissionsModule,
    NotificationsModule,
    CrmModule,
    ConversationsModule,
    PublicModule,
    PublicLeadsModule,
    PlatformAdminModule,
  ],
  controllers: [AppController],
  providers: [AppService, RequestLoggingMiddleware],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggingMiddleware).forRoutes('*');
  }
}
