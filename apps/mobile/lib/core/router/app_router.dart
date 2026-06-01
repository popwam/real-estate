import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/presentation/auth_controller.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/presentation/splash_screen.dart';
import '../../features/commissions/presentation/commission_detail_screen.dart';
import '../../features/commissions/presentation/commissions_list_screen.dart';
import '../../features/conversations/presentation/conversation_detail_screen.dart';
import '../../features/conversations/presentation/conversations_list_screen.dart';
import '../../features/conversations/presentation/public_conversation_token_screen.dart';
import '../../features/crm/presentation/crm_lead_detail_screen.dart';
import '../../features/crm/presentation/crm_leads_list_screen.dart';
import '../../features/crm/presentation/crm_marketplace_leads_screen.dart';
import '../../features/deal_rooms/presentation/deal_room_detail_screen.dart';
import '../../features/deal_rooms/presentation/deal_rooms_list_screen.dart';
import '../../features/deals/presentation/deal_detail_screen.dart';
import '../../features/deals/presentation/deals_list_screen.dart';
import '../../features/lead_claims/presentation/lead_claim_detail_screen.dart';
import '../../features/lead_claims/presentation/lead_claim_form_screen.dart';
import '../../features/lead_claims/presentation/lead_claims_list_screen.dart';
import '../../features/marketplace/presentation/map_search_screen.dart';
import '../../features/marketplace/presentation/marketplace_shell_screen.dart';
import '../../features/profile/presentation/profile_screen.dart';
import '../../features/profile/presentation/broker_profile_screen.dart';
import '../../features/project_detail/presentation/project_detail_screen.dart';
import '../../features/reservation_requests/presentation/reservation_request_detail_screen.dart';
import '../../features/reservation_requests/presentation/reservation_request_form_screen.dart';
import '../../features/reservation_requests/presentation/reservation_requests_list_screen.dart';
import '../../features/unit_detail/presentation/unit_detail_screen.dart';
import '../../shared/widgets/empty_state.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final authController = ref.watch(authControllerProvider);

  return GoRouter(
    initialLocation: '/auth/loading',
    refreshListenable: authController,
    redirect: (context, state) {
      final authState = authController.state;
      final isLogin = state.matchedLocation == '/login';
      final isLoading = state.matchedLocation == '/auth/loading';
      final isPublicConversation = state.matchedLocation.startsWith('/c/');

      if (authState.status == AuthStatus.checking) {
        return isLoading ? null : '/auth/loading';
      }

      if (!authState.isSignedIn) {
        if (isPublicConversation) {
          return null;
        }
        return isLogin ? null : '/login';
      }

      if (isLogin || isLoading) {
        return '/marketplace/projects';
      }

      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(
        path: '/auth/loading',
        builder: (context, state) => const SplashScreen(),
      ),
      ShellRoute(
        builder: (context, state, child) => MarketplaceShellScreen(child: child),
        routes: [
          GoRoute(
            path: '/marketplace/projects',
            builder: (context, state) => const ProjectsListScreen(),
          ),
          GoRoute(
            path: '/marketplace/units',
            builder: (context, state) => const UnitsListScreen(),
          ),
          GoRoute(
            path: '/marketplace/map',
            builder: (context, state) => const MapSearchScreen(),
          ),
          GoRoute(
            path: '/profile',
            builder: (context, state) => const ProfileScreen(),
          ),
          GoRoute(
            path: '/broker-profile',
            builder: (context, state) => const BrokerProfileScreen(),
          ),
          GoRoute(
            path: '/lead-claims',
            builder: (context, state) => const LeadClaimsListScreen(),
          ),
          GoRoute(
            path: '/reservation-requests',
            builder: (context, state) => const ReservationRequestsListScreen(),
          ),
          GoRoute(
            path: '/deal-rooms',
            builder: (context, state) => const DealRoomsListScreen(),
          ),
          GoRoute(
            path: '/deals',
            builder: (context, state) => const DealsListScreen(),
          ),
          GoRoute(
            path: '/commissions',
            builder: (context, state) => const CommissionsListScreen(),
          ),
          GoRoute(
            path: '/crm-leads',
            builder: (context, state) => const CrmLeadsListScreen(),
          ),
          GoRoute(
            path: '/crm-marketplace-leads',
            builder: (context, state) => const CrmMarketplaceLeadsScreen(),
          ),
          GoRoute(
            path: '/crm-conversations',
            builder: (context, state) => const ConversationsListScreen(),
          ),
        ],
      ),
      GoRoute(
        path: '/c/:token',
        builder: (context, state) {
          return PublicConversationTokenScreen(
            token: state.pathParameters['token']!,
          );
        },
      ),
      GoRoute(
        path: '/crm-leads/:id',
        builder: (context, state) {
          return CrmLeadDetailScreen(leadId: state.pathParameters['id']!);
        },
      ),
      GoRoute(
        path: '/crm-conversations/:id',
        builder: (context, state) {
          return ConversationDetailScreen(
            conversationId: state.pathParameters['id']!,
          );
        },
      ),
      GoRoute(
        path: '/deal-rooms/:id',
        builder: (context, state) {
          return DealRoomDetailScreen(roomId: state.pathParameters['id']!);
        },
      ),
      GoRoute(
        path: '/deals/:id',
        builder: (context, state) {
          return DealDetailScreen(dealId: state.pathParameters['id']!);
        },
      ),
      GoRoute(
        path: '/commissions/:id',
        builder: (context, state) {
          return CommissionDetailScreen(
            commissionId: state.pathParameters['id']!,
          );
        },
      ),
      GoRoute(
        path: '/lead-claims/new',
        builder: (context, state) {
          final projectId = state.uri.queryParameters['projectId'];
          if (projectId == null || projectId.isEmpty) {
            return const _MissingRouteInputScreen(
              title: 'Create lead claim',
              message: 'Open a project or unit first, then create the claim.',
            );
          }
          return LeadClaimFormScreen(
            projectId: projectId,
            unitId: state.uri.queryParameters['unitId'],
          );
        },
      ),
      GoRoute(
        path: '/lead-claims/:id',
        builder: (context, state) {
          return LeadClaimDetailScreen(claimId: state.pathParameters['id']!);
        },
      ),
      GoRoute(
        path: '/reservation-requests/new',
        builder: (context, state) {
          final draft = state.extra;
          if (draft is! ReservationRequestDraft) {
            return const _MissingRouteInputScreen(
              title: 'Reservation request',
              message: 'Open an active lead claim first, then create the request.',
            );
          }
          return ReservationRequestFormScreen(draft: draft);
        },
      ),
      GoRoute(
        path: '/reservation-requests/:id',
        builder: (context, state) {
          return ReservationRequestDetailScreen(
            requestId: state.pathParameters['id']!,
          );
        },
      ),
      GoRoute(
        path: '/projects/:id',
        builder: (context, state) {
          return ProjectDetailScreen(projectId: state.pathParameters['id']!);
        },
      ),
      GoRoute(
        path: '/units/:id',
        builder: (context, state) {
          return UnitDetailScreen(unitId: state.pathParameters['id']!);
        },
      ),
    ],
    errorBuilder: (context, state) {
      return Scaffold(
        appBar: AppBar(title: const Text('POPWAM')),
        body: Center(child: Text(state.error?.toString() ?? 'Route not found')),
      );
    },
  );
});

class _MissingRouteInputScreen extends StatelessWidget {
  const _MissingRouteInputScreen({
    required this.title,
    required this.message,
  });

  final String title;
  final String message;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: EmptyState(
        title: title,
        message: message,
        icon: Icons.info_outline,
      ),
    );
  }
}
