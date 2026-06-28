// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appTitle => 'POPWAM';

  @override
  String get appTagline => 'Verified real estate marketplace';

  @override
  String get language => 'Language';

  @override
  String get english => 'English';

  @override
  String get arabic => 'Arabic';

  @override
  String get french => 'French';

  @override
  String get emailOrPhone => 'Email or phone';

  @override
  String get emailOrPhoneRequired => 'Email or phone is required';

  @override
  String get password => 'Password';

  @override
  String get passwordRequired => 'Password is required';

  @override
  String get signIn => 'Sign in';

  @override
  String get invalidLoginDetails => 'Invalid login details';

  @override
  String get networkError => 'Network error';

  @override
  String get requestTimedOut =>
      'The API is taking too long to respond. Please check your connection and try again.';

  @override
  String get couldNotReachApi =>
      'Could not reach the API. Check your internet connection or API environment.';

  @override
  String get secureConnectionError =>
      'The secure connection could not be verified. Please contact support.';

  @override
  String get requestCancelled => 'The request was cancelled. Please try again.';

  @override
  String get sessionExpired => 'Your session expired. Please sign in again.';

  @override
  String get workspaceAccessDenied =>
      'You do not have access to this mobile workspace.';

  @override
  String get mobileResourceNotFound =>
      'The requested mobile resource was not found.';

  @override
  String get requestFailed => 'Request failed';

  @override
  String get projects => 'Projects';

  @override
  String get searchProjects => 'Search projects';

  @override
  String get projectDetails => 'Project details';

  @override
  String get requestDetails => 'Request details';

  @override
  String get leads => 'Leads';

  @override
  String get conversations => 'Conversations';

  @override
  String get dealRooms => 'Deal rooms';

  @override
  String get reservations => 'Reservations';

  @override
  String get profile => 'Profile';

  @override
  String get settings => 'Settings';

  @override
  String get logout => 'Logout';

  @override
  String get loading => 'Loading';

  @override
  String get noResultsYet => 'No results yet';

  @override
  String get tryAgain => 'Try again';

  @override
  String get retry => 'Retry';

  @override
  String get sendMessage => 'Send message';

  @override
  String get send => 'Send';

  @override
  String get sending => 'Sending';

  @override
  String get dismiss => 'Dismiss';

  @override
  String get marketplace => 'Marketplace';

  @override
  String get units => 'Units';

  @override
  String get map => 'Map';

  @override
  String get refreshProjects => 'Refresh projects';

  @override
  String get refreshUnits => 'Refresh units';

  @override
  String get refreshMapSearch => 'Refresh map search';

  @override
  String get refreshRequests => 'Refresh requests';

  @override
  String get refreshDealRooms => 'Refresh deal rooms';

  @override
  String get refreshDeals => 'Refresh deals';

  @override
  String get refreshCommissions => 'Refresh commissions';

  @override
  String get refreshConversations => 'Refresh conversations';

  @override
  String get refreshLead => 'Refresh lead';

  @override
  String get refreshCrmLeads => 'Refresh CRM leads';

  @override
  String get refreshMarketplaceCrmLeads => 'Refresh marketplace CRM leads';

  @override
  String get refreshCrmSummary => 'Refresh CRM summary';

  @override
  String get filters => 'Filters';

  @override
  String get closeFilters => 'Close filters';

  @override
  String get marketplaceFilters => 'Marketplace filters';

  @override
  String get city => 'City';

  @override
  String get district => 'District';

  @override
  String get unitType => 'Unit type';

  @override
  String get minPrice => 'Min price';

  @override
  String get maxPrice => 'Max price';

  @override
  String get bedrooms => 'Bedrooms';

  @override
  String get bathrooms => 'Bathrooms';

  @override
  String get minArea => 'Min area';

  @override
  String get maxArea => 'Max area';

  @override
  String get clear => 'Clear';

  @override
  String get apply => 'Apply';

  @override
  String get noVisibleProjects => 'No visible projects';

  @override
  String get projectsAppearHere =>
      'Projects appear here when the API exposes them to you.';

  @override
  String get projectsUnavailable => 'Projects unavailable';

  @override
  String get noVisibleUnits => 'No visible units';

  @override
  String get availableInventoryAppearsHere =>
      'Available inventory appears here after API visibility checks.';

  @override
  String get unitsUnavailable => 'Units unavailable';

  @override
  String get project => 'Project';

  @override
  String get unit => 'Unit';

  @override
  String get images => 'Images';

  @override
  String get paymentPlans => 'Payment plans';

  @override
  String get paymentDetails => 'Payment details';

  @override
  String get availableUnits => 'Available units';

  @override
  String get createLeadClaim => 'Create lead claim';

  @override
  String get noUnitsVisible => 'No units visible';

  @override
  String get backendDidNotExposeUnits =>
      'The backend did not expose units for this project.';

  @override
  String get projectUnavailable => 'Project unavailable';

  @override
  String get unitUnavailable => 'Unit unavailable';

  @override
  String developerLabel(Object name) {
    return 'Developer: $name';
  }

  @override
  String get status => 'Status';

  @override
  String get visibility => 'Visibility';

  @override
  String get type => 'Type';

  @override
  String get area => 'Area';

  @override
  String get floor => 'Floor';

  @override
  String get projectPending => 'Project pending';

  @override
  String get locationPending => 'Location pending';

  @override
  String get priceOnRequest => 'Price on request';

  @override
  String get amountPending => 'Amount pending';

  @override
  String fromPrice(Object price) {
    return 'From $price';
  }

  @override
  String unitsCount(Object count) {
    return '$count units';
  }

  @override
  String bedCount(Object count) {
    return '$count bed';
  }

  @override
  String sqmValue(Object value) {
    return '$value sqm';
  }

  @override
  String get noPaymentPlans => 'No payment plans returned yet.';

  @override
  String downPaymentPercent(Object value) {
    return '$value% down';
  }

  @override
  String installmentsCount(Object count) {
    return '$count installments';
  }

  @override
  String yearsCount(Object count) {
    return '$count years';
  }

  @override
  String get mapSearch => 'Map search';

  @override
  String get mapPlaceholder => 'Map UI placeholder using backend bbox search.';

  @override
  String get noMapResults => 'No map results';

  @override
  String get mapResultsAppearHere =>
      'Visible projects inside the bbox will appear here.';

  @override
  String get mapSearchUnavailable => 'Map search unavailable';

  @override
  String get crmLeads => 'CRM leads';

  @override
  String get marketplaceCrmLeads => 'Marketplace CRM leads';

  @override
  String get crmConversations => 'CRM conversations';

  @override
  String get crmLead => 'CRM lead';

  @override
  String get noCrmLeads => 'No CRM leads';

  @override
  String get crmLeadsAppearHere =>
      'Public and claimed CRM leads in your scope appear here.';

  @override
  String get crmLeadsUnavailable => 'CRM leads unavailable';

  @override
  String get noMarketplaceCrmLeads => 'No marketplace CRM leads';

  @override
  String get marketplaceCrmLeadsAppearHere =>
      'Claimable CRM leads appear here when available.';

  @override
  String get marketplaceCrmLeadsUnavailable =>
      'Marketplace CRM leads unavailable';

  @override
  String get maskedLead => 'Masked lead';

  @override
  String phoneEnding(Object digits) {
    return 'Phone ending $digits';
  }

  @override
  String get noProjectAttached => 'No project attached';

  @override
  String createdAt(Object date) {
    return 'Created $date';
  }

  @override
  String updatedAt(Object date) {
    return 'Updated $date';
  }

  @override
  String expiresAt(Object date) {
    return 'Expires $date';
  }

  @override
  String get expires => 'Expires';

  @override
  String soldAt(Object date) {
    return 'Sold $date';
  }

  @override
  String get sold => 'Sold';

  @override
  String openedAt(Object date) {
    return 'opened $date';
  }

  @override
  String get claimed => 'Claimed';

  @override
  String get unclaimed => 'Unclaimed';

  @override
  String get unavailable => 'Unavailable';

  @override
  String get all => 'All';

  @override
  String get newStatus => 'New';

  @override
  String get inChat => 'In chat';

  @override
  String get qualified => 'Qualified';

  @override
  String get lost => 'Lost';

  @override
  String get converted => 'Converted';

  @override
  String get spam => 'Spam';

  @override
  String get contact => 'Contact';

  @override
  String get call => 'Call';

  @override
  String get chat => 'Chat';

  @override
  String get whatsApp => 'WhatsApp';

  @override
  String get actions => 'Actions';

  @override
  String get openConversation => 'Open conversation';

  @override
  String get claimLead => 'Claim lead';

  @override
  String get claim => 'Claim';

  @override
  String get updateStatus => 'Update status';

  @override
  String get updateLeadStatus => 'Update lead status';

  @override
  String get saveStatus => 'Save status';

  @override
  String get statusNoteOptional => 'Status note optional';

  @override
  String get leadClaimed => 'Lead claimed.';

  @override
  String get leadAlreadyClaimed => 'This lead has already been claimed.';

  @override
  String get leadStatusUpdated => 'Lead status updated.';

  @override
  String get projectLabel => 'Project';

  @override
  String get sourcePage => 'Source page';

  @override
  String get created => 'Created';

  @override
  String get claimedLabel => 'Claimed';

  @override
  String get claimOrganization => 'Claim organization';

  @override
  String get statusNote => 'Status note';

  @override
  String get utm => 'UTM';

  @override
  String get crmSummary => 'CRM summary';

  @override
  String crmSummaryUnavailable(Object message) {
    return 'CRM summary unavailable: $message';
  }

  @override
  String get totalLeads => 'Total leads';

  @override
  String get newLeads => 'New';

  @override
  String get qualifiedLeads => 'Qualified';

  @override
  String get openChats => 'Open chats';

  @override
  String get todayLeads => 'Today leads';

  @override
  String get todayMessages => 'Today messages';

  @override
  String get conversation => 'Conversation';

  @override
  String get publicConversation => 'Public conversation';

  @override
  String get noConversations => 'No conversations';

  @override
  String get conversationsAppearHere =>
      'CRM conversations in your scope appear here.';

  @override
  String get conversationUnavailable => 'Conversation unavailable';

  @override
  String get conversationsUnavailable => 'Conversations unavailable';

  @override
  String get crmConversation => 'CRM conversation';

  @override
  String get shareLink => 'Share link';

  @override
  String get publicShareToken => 'Public share token';

  @override
  String get noMessagesYet => 'No messages yet';

  @override
  String get messagesAppearHere => 'Messages in this conversation appear here.';

  @override
  String get messagesUnavailable => 'Messages unavailable';

  @override
  String get writeMessage => 'Write a message';

  @override
  String get updateConversationStatus => 'Update conversation status';

  @override
  String get conversationStatusUpdated => 'Conversation status updated.';

  @override
  String get open => 'Open';

  @override
  String get closed => 'Closed';

  @override
  String get archived => 'Archived';

  @override
  String get thisSharedConversation =>
      'This shared conversation shows only public-safe chat fields.';

  @override
  String get publicSafeMessagesAppearHere =>
      'Public-safe messages for this conversation appear here.';

  @override
  String get conversationClosed => 'This conversation is closed.';

  @override
  String get reply => 'Reply';

  @override
  String get yourNameOptional => 'Your name optional';

  @override
  String get message => 'Message';

  @override
  String get writePlainTextReply => 'Write a plain-text reply';

  @override
  String get sendReply => 'Send reply';

  @override
  String get messageSent => 'Message sent.';

  @override
  String get enterMessageBeforeSending =>
      'Please enter a message before sending.';

  @override
  String get messageTooLong =>
      'Message is too long. Please keep it under 2000 characters.';

  @override
  String get conversationLinkUnavailable =>
      'This conversation link is no longer available.';

  @override
  String get tooManyMessages => 'Too many messages. Please try again shortly.';

  @override
  String get checkMessageTryAgain => 'Please check your message and try again.';

  @override
  String get couldNotSendMessage =>
      'Could not send your message. Please try again.';

  @override
  String get signedIn => 'Signed in';

  @override
  String get role => 'Role';

  @override
  String get organization => 'Organization';

  @override
  String get brokerProfile => 'Broker profile';

  @override
  String get myLeadClaims => 'My lead claims';

  @override
  String get reservationRequests => 'Reservation requests';

  @override
  String get myDeals => 'My deals';

  @override
  String get myCommissions => 'My commissions';

  @override
  String get editPlaceholder => 'Edit placeholder';

  @override
  String get editBrokerProfile => 'Edit broker profile';

  @override
  String get brokerProfileUnavailable => 'Broker profile unavailable';

  @override
  String get brokerProfileBackendReady =>
      'This screen is ready for GET /broker-profile/me when the backend exposes it.';

  @override
  String get editProfileInactive => 'Edit profile is not active yet';

  @override
  String get profileUpdateApisUnavailable =>
      'Profile update APIs are not part of the current backend slice.';

  @override
  String get license => 'License';

  @override
  String get phone => 'Phone';

  @override
  String get country => 'Country';

  @override
  String get experience => 'Experience';

  @override
  String yearsExperience(Object count) {
    return '$count years';
  }

  @override
  String get noReservationRequests => 'No reservation requests';

  @override
  String get createRequestFromLeadClaim =>
      'Create a request from an active lead claim.';

  @override
  String get requestsUnavailable => 'Requests unavailable';

  @override
  String get reservationRequest => 'Reservation request';

  @override
  String get reservationRequestCancelled => 'Reservation request cancelled.';

  @override
  String get dealRoomCreated => 'Deal room created.';

  @override
  String get createDealRoom => 'Create deal room';

  @override
  String get cancelRequest => 'Cancel request';

  @override
  String get requestUnavailable => 'Request unavailable';

  @override
  String get approved => 'Approved';

  @override
  String get rejected => 'Rejected';

  @override
  String get cancelled => 'Cancelled';

  @override
  String get reason => 'Reason';

  @override
  String get notes => 'Notes';

  @override
  String unitLabel(Object value) {
    return 'Unit: $value';
  }

  @override
  String get submitReservationRequest => 'Submit reservation request';

  @override
  String reservationRequestStatus(Object status) {
    return 'Reservation request $status.';
  }

  @override
  String get noDealRooms => 'No deal rooms';

  @override
  String get dealRoomsAppearHere =>
      'Deal rooms appear here after an approved reservation is opened.';

  @override
  String get dealRoomsUnavailable => 'Deal rooms unavailable';

  @override
  String get dealRoomNotFound => 'Deal room not found';

  @override
  String get dealRoomAccessDenied => 'You do not have access to this deal room';

  @override
  String get couldNotLoadDealRoomTryAgain =>
      'Could not load deal room. Try again.';

  @override
  String get dealRoom => 'Deal room';

  @override
  String get dealRoomActions => 'Deal room actions';

  @override
  String get moveToNegotiation => 'Move to negotiation';

  @override
  String get moveToPendingApproval => 'Move to pending approval';

  @override
  String get inviteClient => 'Invite client';

  @override
  String get clientInviteCreated => 'Client invite created.';

  @override
  String dealRoomMovedTo(Object status) {
    return 'Deal room moved to $status.';
  }

  @override
  String get participants => 'Participants';

  @override
  String get noParticipantsYet => 'No participants returned yet.';

  @override
  String get clientInvite => 'Client invite';

  @override
  String get notInvited => 'Not invited';

  @override
  String get messages => 'Messages';

  @override
  String get messagesAndStatusAppearHere =>
      'Messages and status updates appear here.';

  @override
  String participantsCount(Object count) {
    return '$count participants';
  }

  @override
  String messagesCount(Object count) {
    return '$count messages';
  }

  @override
  String messagesOpenedSummary(Object count, Object date) {
    return '$count messages · opened $date';
  }

  @override
  String reservationStatus(Object status) {
    return 'Reservation $status';
  }

  @override
  String get leadClaim => 'Lead claim';

  @override
  String get noLeadClaims => 'No lead claims';

  @override
  String get createClaimFromProjectOrUnit =>
      'Create a claim from a project or unit detail screen.';

  @override
  String get claimsUnavailable => 'Claims unavailable';

  @override
  String get claimUnavailable => 'Claim unavailable';

  @override
  String get leadClaimReleased => 'Lead claim released.';

  @override
  String get createReservationRequest => 'Create reservation request';

  @override
  String get releaseClaim => 'Release claim';

  @override
  String get client => 'Client';

  @override
  String get noUnitSelected => 'No unit selected';

  @override
  String get released => 'Released';

  @override
  String get clientName => 'Client name';

  @override
  String get clientNameRequired => 'Client name is required';

  @override
  String get clientPhone => 'Client phone';

  @override
  String get clientPhoneRequired => 'Client phone is required';

  @override
  String get sourceManual => 'Source: MANUAL';

  @override
  String get leadClaimCreated => 'Lead claim created.';

  @override
  String get clientAlreadyRegistered =>
      'This client is already registered for this project.';

  @override
  String get deal => 'Deal';

  @override
  String get noDealsYet => 'No deals yet';

  @override
  String get dealsAppearHere =>
      'Sold and approved deals scoped to you appear here.';

  @override
  String get dealsUnavailable => 'Deals unavailable';

  @override
  String get dealUnavailable => 'Deal unavailable';

  @override
  String get dealRoomLabel => 'Deal room';

  @override
  String get broker => 'Broker';

  @override
  String get brokerage => 'Brokerage';

  @override
  String get openDealRoom => 'Open deal room';

  @override
  String roomShortId(Object id) {
    return 'Room $id';
  }

  @override
  String get commission => 'Commission';

  @override
  String get noCommissionsYet => 'No commissions yet';

  @override
  String get commissionsAppearHere =>
      'Commission entries scoped to you appear here.';

  @override
  String get commissionsUnavailable => 'Commissions unavailable';

  @override
  String get commissionUnavailable => 'Commission unavailable';

  @override
  String get openDeal => 'Open deal';

  @override
  String get routeNotFound => 'Route not found';

  @override
  String get openProjectOrUnitFirst =>
      'Open a project or unit first, then create the claim.';

  @override
  String get openActiveLeadClaimFirst =>
      'Open an active lead claim first, then create the request.';

  @override
  String get continueAsGuest => 'Continue as guest';

  @override
  String get continueBrowsing => 'Continue browsing';

  @override
  String get guestMarketplaceTitle => 'Browse as a guest';

  @override
  String get guestMarketplaceMessage =>
      'Explore public projects without signing in. Sign in when you need workspace tools or protected actions.';

  @override
  String get signInToRequest => 'Sign in to request';
}
