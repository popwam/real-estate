import '../../features/auth/data/auth_models.dart';

const publicHomeRoute = '/marketplace/projects';
const loginRoute = '/login';

const _workspaceRoutePrefixes = [
  '/broker-profile',
  '/lead-claims',
  '/reservation-requests',
  '/deal-rooms',
  '/deals',
  '/commissions',
  '/crm-leads',
  '/crm-marketplace-leads',
  '/crm-conversations',
];

const _publicRoutePrefixes = [
  publicHomeRoute,
  '/marketplace/units',
  '/marketplace/map',
  '/marketplace/projects/',
  '/marketplace/units/',
  '/projects/',
  '/units/',
  '/c/',
  '/profile',
  loginRoute,
  '/auth/loading',
];

bool isProtectedMobileRoute(String location) {
  return _workspaceRoutePrefixes.any(
    (prefix) => location == prefix || location.startsWith('$prefix/'),
  );
}

bool isPublicMobileRoute(String location) {
  return _publicRoutePrefixes.any(
    (prefix) => location == prefix || location.startsWith(prefix),
  );
}

String homeRouteForUser(AuthUser user, {Iterable<String> permissions = const []}) {
  final permissionSet = permissions.toSet();
  if (_hasAny(permissionSet, const [
    'crm.leads.view_own',
    'crm.leads.view_project',
    'crm.leads.manage_own',
  ])) {
    return '/crm-leads';
  }
  if (_hasAny(permissionSet, const [
    'lead_claims.view_own',
    'lead_claims.create',
  ])) {
    return '/lead-claims';
  }
  if (_hasAny(permissionSet, const [
    'deal_rooms.view_own',
    'deal_rooms.join',
    'deal_rooms.manage',
  ])) {
    return '/deal-rooms';
  }

  final role = user.role.toUpperCase();
  if (role.startsWith('PLATFORM_')) {
    return '/crm-leads';
  }
  if (role.startsWith('DEVELOPER_')) {
    return '/crm-leads';
  }
  if (role.startsWith('BROKERAGE_') || role == 'BROKER') {
    return '/lead-claims';
  }
  return publicHomeRoute;
}

bool canAccessMobileRoute(AuthSession session, String location) {
  if (!isProtectedMobileRoute(location)) return true;

  if (_matches(location, '/crm-leads') || _matches(location, '/crm-marketplace-leads')) {
    return canAccessWorkspaceFeature(session, MobileWorkspaceFeature.crm);
  }
  if (_matches(location, '/crm-conversations')) {
    return canAccessWorkspaceFeature(session, MobileWorkspaceFeature.conversations);
  }
  if (_matches(location, '/broker-profile')) {
    return canAccessWorkspaceFeature(session, MobileWorkspaceFeature.brokerProfile);
  }
  if (_matches(location, '/lead-claims')) {
    return canAccessWorkspaceFeature(session, MobileWorkspaceFeature.leadClaims);
  }
  if (_matches(location, '/reservation-requests')) {
    return canAccessWorkspaceFeature(session, MobileWorkspaceFeature.reservations);
  }
  if (_matches(location, '/deal-rooms')) {
    return canAccessWorkspaceFeature(session, MobileWorkspaceFeature.dealRooms);
  }
  if (_matches(location, '/deals')) {
    return canAccessWorkspaceFeature(session, MobileWorkspaceFeature.deals);
  }
  if (_matches(location, '/commissions')) {
    return canAccessWorkspaceFeature(session, MobileWorkspaceFeature.commissions);
  }
  return false;
}

enum MobileWorkspaceFeature {
  crm,
  conversations,
  brokerProfile,
  leadClaims,
  reservations,
  dealRooms,
  deals,
  commissions,
}

bool canAccessWorkspaceFeature(
  AuthSession session,
  MobileWorkspaceFeature feature,
) {
  final role = session.user.role.toUpperCase();
  final permissions = session.permissions.toSet();

  return switch (feature) {
    MobileWorkspaceFeature.crm =>
      _hasAny(permissions, const [
        'crm.leads.view_own',
        'crm.leads.view_project',
        'crm.leads.manage_own',
      ]) ||
      role.startsWith('PLATFORM_') ||
      role.startsWith('DEVELOPER_') ||
      role.startsWith('BROKERAGE_') ||
      role == 'BROKER',
    MobileWorkspaceFeature.conversations =>
      _hasAny(permissions, const [
        'crm.conversations.manage_own',
        'crm.conversations.view_project',
      ]) ||
      role.startsWith('PLATFORM_') ||
      role.startsWith('DEVELOPER_') ||
      role.startsWith('BROKERAGE_') ||
      role == 'BROKER',
    MobileWorkspaceFeature.brokerProfile =>
      role.startsWith('BROKERAGE_') || role == 'BROKER',
    MobileWorkspaceFeature.leadClaims =>
      _hasAny(permissions, const [
        'lead_claims.create',
        'lead_claims.view_own',
      ]) ||
      role.startsWith('BROKERAGE_') ||
      role == 'BROKER',
    MobileWorkspaceFeature.reservations =>
      _hasAny(permissions, const [
        'reservation_requests.create',
        'reservation_requests.view_own',
        'reservation_requests.approve',
      ]) ||
      role.startsWith('DEVELOPER_') ||
      role.startsWith('BROKERAGE_') ||
      role == 'BROKER',
    MobileWorkspaceFeature.dealRooms =>
      _hasAny(permissions, const [
        'deal_rooms.join',
        'deal_rooms.view_own',
        'deal_rooms.manage',
      ]) ||
      role.startsWith('PLATFORM_') ||
      role.startsWith('DEVELOPER_') ||
      role.startsWith('BROKERAGE_') ||
      role == 'BROKER',
    MobileWorkspaceFeature.deals =>
      _hasAny(permissions, const [
        'deals.view_own',
        'deals.mark_sold',
        'deals.approve',
      ]) ||
      role.startsWith('PLATFORM_') ||
      role.startsWith('DEVELOPER_') ||
      role.startsWith('BROKERAGE_') ||
      role == 'BROKER',
    MobileWorkspaceFeature.commissions =>
      _hasAny(permissions, const [
        'commissions.view_own',
        'commissions.approve',
      ]) ||
      role.startsWith('PLATFORM_') ||
      role.startsWith('DEVELOPER_') ||
      role.startsWith('BROKERAGE_') ||
      role == 'BROKER',
  };
}

bool _matches(String location, String prefix) {
  return location == prefix || location.startsWith('$prefix/');
}

bool _hasAny(Set<String> permissions, List<String> expected) {
  return expected.any(permissions.contains);
}
