// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for French (`fr`).
class AppLocalizationsFr extends AppLocalizations {
  AppLocalizationsFr([String locale = 'fr']) : super(locale);

  @override
  String get appTitle => 'POPWAM';

  @override
  String get appTagline => 'Place de marché immobilière vérifiée';

  @override
  String get language => 'Langue';

  @override
  String get english => 'Anglais';

  @override
  String get arabic => 'Arabe';

  @override
  String get french => 'Français';

  @override
  String get emailOrPhone => 'E-mail ou téléphone';

  @override
  String get emailOrPhoneRequired => 'L’e-mail ou le téléphone est requis';

  @override
  String get password => 'Mot de passe';

  @override
  String get passwordRequired => 'Le mot de passe est requis';

  @override
  String get signIn => 'Se connecter';

  @override
  String get invalidLoginDetails => 'Identifiants invalides';

  @override
  String get networkError => 'Erreur réseau';

  @override
  String get requestTimedOut =>
      'L’API met trop de temps à répondre. Vérifiez votre connexion et réessayez.';

  @override
  String get couldNotReachApi =>
      'Impossible de joindre l’API. Vérifiez votre connexion internet ou l’environnement API.';

  @override
  String get secureConnectionError =>
      'La connexion sécurisée n’a pas pu être vérifiée. Contactez le support.';

  @override
  String get requestCancelled => 'La requête a été annulée. Réessayez.';

  @override
  String get sessionExpired =>
      'Votre session a expiré. Connectez-vous à nouveau.';

  @override
  String get workspaceAccessDenied =>
      'Vous n’avez pas accès à cet espace mobile.';

  @override
  String get mobileResourceNotFound =>
      'La ressource mobile demandée est introuvable.';

  @override
  String get requestFailed => 'La requête a échoué';

  @override
  String get projects => 'Projets';

  @override
  String get searchProjects => 'Rechercher des projets';

  @override
  String get projectDetails => 'Détails du projet';

  @override
  String get requestDetails => 'Détails de la demande';

  @override
  String get leads => 'Prospects';

  @override
  String get conversations => 'Conversations';

  @override
  String get dealRooms => 'Salons de vente';

  @override
  String get reservations => 'Réservations';

  @override
  String get profile => 'Profil';

  @override
  String get settings => 'Paramètres';

  @override
  String get logout => 'Déconnexion';

  @override
  String get loading => 'Chargement';

  @override
  String get noResultsYet => 'Aucun résultat pour le moment';

  @override
  String get tryAgain => 'Réessayer';

  @override
  String get retry => 'Réessayer';

  @override
  String get sendMessage => 'Envoyer un message';

  @override
  String get send => 'Envoyer';

  @override
  String get sending => 'Envoi';

  @override
  String get dismiss => 'Fermer';

  @override
  String get marketplace => 'Marché';

  @override
  String get units => 'Unités';

  @override
  String get map => 'Carte';

  @override
  String get refreshProjects => 'Actualiser les projets';

  @override
  String get refreshUnits => 'Actualiser les unités';

  @override
  String get refreshMapSearch => 'Actualiser la recherche carte';

  @override
  String get refreshRequests => 'Actualiser les demandes';

  @override
  String get refreshDealRooms => 'Actualiser les salons de vente';

  @override
  String get refreshDeals => 'Actualiser les ventes';

  @override
  String get refreshCommissions => 'Actualiser les commissions';

  @override
  String get refreshConversations => 'Actualiser les conversations';

  @override
  String get refreshLead => 'Actualiser le prospect';

  @override
  String get refreshCrmLeads => 'Actualiser les prospects CRM';

  @override
  String get refreshMarketplaceCrmLeads =>
      'Actualiser les prospects CRM du marché';

  @override
  String get refreshCrmSummary => 'Actualiser le résumé CRM';

  @override
  String get filters => 'Filtres';

  @override
  String get closeFilters => 'Fermer les filtres';

  @override
  String get marketplaceFilters => 'Filtres du marché';

  @override
  String get city => 'Ville';

  @override
  String get district => 'Quartier';

  @override
  String get unitType => 'Type d’unité';

  @override
  String get minPrice => 'Prix min.';

  @override
  String get maxPrice => 'Prix max.';

  @override
  String get bedrooms => 'Chambres';

  @override
  String get bathrooms => 'Salles de bain';

  @override
  String get minArea => 'Surface min.';

  @override
  String get maxArea => 'Surface max.';

  @override
  String get clear => 'Effacer';

  @override
  String get apply => 'Appliquer';

  @override
  String get noVisibleProjects => 'Aucun projet visible';

  @override
  String get projectsAppearHere =>
      'Les projets apparaissent ici lorsque l’API vous les expose.';

  @override
  String get projectsUnavailable => 'Projets indisponibles';

  @override
  String get noVisibleUnits => 'Aucune unité visible';

  @override
  String get availableInventoryAppearsHere =>
      'Le stock disponible apparaît ici après les contrôles de visibilité de l’API.';

  @override
  String get unitsUnavailable => 'Unités indisponibles';

  @override
  String get project => 'Projet';

  @override
  String get unit => 'Unité';

  @override
  String get images => 'Images';

  @override
  String get paymentPlans => 'Plans de paiement';

  @override
  String get paymentDetails => 'Détails de paiement';

  @override
  String get availableUnits => 'Unités disponibles';

  @override
  String get createLeadClaim => 'Créer une demande prospect';

  @override
  String get noUnitsVisible => 'Aucune unité visible';

  @override
  String get backendDidNotExposeUnits =>
      'Le backend n’a exposé aucune unité pour ce projet.';

  @override
  String get projectUnavailable => 'Projet indisponible';

  @override
  String get unitUnavailable => 'Unité indisponible';

  @override
  String developerLabel(Object name) {
    return 'Promoteur : $name';
  }

  @override
  String get status => 'Statut';

  @override
  String get visibility => 'Visibilité';

  @override
  String get type => 'Type';

  @override
  String get area => 'Surface';

  @override
  String get floor => 'Étage';

  @override
  String get projectPending => 'Projet en attente';

  @override
  String get locationPending => 'Emplacement en attente';

  @override
  String get priceOnRequest => 'Prix sur demande';

  @override
  String get amountPending => 'Montant en attente';

  @override
  String fromPrice(Object price) {
    return 'À partir de $price';
  }

  @override
  String unitsCount(Object count) {
    return '$count unités';
  }

  @override
  String bedCount(Object count) {
    return '$count ch.';
  }

  @override
  String sqmValue(Object value) {
    return '$value m²';
  }

  @override
  String get noPaymentPlans =>
      'Aucun plan de paiement retourné pour le moment.';

  @override
  String downPaymentPercent(Object value) {
    return '$value % d’apport';
  }

  @override
  String installmentsCount(Object count) {
    return '$count mensualités';
  }

  @override
  String yearsCount(Object count) {
    return '$count ans';
  }

  @override
  String get mapSearch => 'Recherche carte';

  @override
  String get mapPlaceholder =>
      'Interface carte provisoire avec recherche bbox côté backend.';

  @override
  String get noMapResults => 'Aucun résultat sur la carte';

  @override
  String get mapResultsAppearHere =>
      'Les projets visibles dans la bbox apparaîtront ici.';

  @override
  String get mapSearchUnavailable => 'Recherche carte indisponible';

  @override
  String get crmLeads => 'Prospects CRM';

  @override
  String get marketplaceCrmLeads => 'Prospects CRM du marché';

  @override
  String get crmConversations => 'Conversations CRM';

  @override
  String get crmLead => 'Prospect CRM';

  @override
  String get noCrmLeads => 'Aucun prospect CRM';

  @override
  String get crmLeadsAppearHere =>
      'Les prospects CRM publics et réclamés dans votre périmètre apparaissent ici.';

  @override
  String get crmLeadsUnavailable => 'Prospects CRM indisponibles';

  @override
  String get noMarketplaceCrmLeads => 'Aucun prospect CRM du marché';

  @override
  String get marketplaceCrmLeadsAppearHere =>
      'Les prospects CRM réclamables apparaissent ici lorsqu’ils sont disponibles.';

  @override
  String get marketplaceCrmLeadsUnavailable =>
      'Prospects CRM du marché indisponibles';

  @override
  String get maskedLead => 'Prospect masqué';

  @override
  String phoneEnding(Object digits) {
    return 'Téléphone se terminant par $digits';
  }

  @override
  String get noProjectAttached => 'Aucun projet lié';

  @override
  String createdAt(Object date) {
    return 'Créé le $date';
  }

  @override
  String updatedAt(Object date) {
    return 'Mis à jour le $date';
  }

  @override
  String expiresAt(Object date) {
    return 'Expire le $date';
  }

  @override
  String get expires => 'Expire';

  @override
  String soldAt(Object date) {
    return 'Vendu le $date';
  }

  @override
  String get sold => 'Vendu';

  @override
  String openedAt(Object date) {
    return 'ouvert le $date';
  }

  @override
  String get claimed => 'Réclamé';

  @override
  String get unclaimed => 'Non réclamé';

  @override
  String get unavailable => 'Indisponible';

  @override
  String get all => 'Tous';

  @override
  String get newStatus => 'Nouveau';

  @override
  String get inChat => 'En discussion';

  @override
  String get qualified => 'Qualifié';

  @override
  String get lost => 'Perdu';

  @override
  String get converted => 'Converti';

  @override
  String get spam => 'Spam';

  @override
  String get contact => 'Contact';

  @override
  String get call => 'Appel';

  @override
  String get chat => 'Chat';

  @override
  String get whatsApp => 'WhatsApp';

  @override
  String get actions => 'Actions';

  @override
  String get openConversation => 'Ouvrir la conversation';

  @override
  String get claimLead => 'Réclamer le prospect';

  @override
  String get claim => 'Réclamer';

  @override
  String get updateStatus => 'Mettre à jour le statut';

  @override
  String get updateLeadStatus => 'Mettre à jour le statut du prospect';

  @override
  String get saveStatus => 'Enregistrer le statut';

  @override
  String get statusNoteOptional => 'Note de statut facultative';

  @override
  String get leadClaimed => 'Prospect réclamé.';

  @override
  String get leadAlreadyClaimed => 'Ce prospect a déjà été réclamé.';

  @override
  String get leadStatusUpdated => 'Statut du prospect mis à jour.';

  @override
  String get projectLabel => 'Projet';

  @override
  String get sourcePage => 'Page source';

  @override
  String get created => 'Créé';

  @override
  String get claimedLabel => 'Réclamé';

  @override
  String get claimOrganization => 'Organisation de réclamation';

  @override
  String get statusNote => 'Note de statut';

  @override
  String get utm => 'UTM';

  @override
  String get crmSummary => 'Résumé CRM';

  @override
  String crmSummaryUnavailable(Object message) {
    return 'Résumé CRM indisponible : $message';
  }

  @override
  String get totalLeads => 'Total prospects';

  @override
  String get newLeads => 'Nouveaux';

  @override
  String get qualifiedLeads => 'Qualifiés';

  @override
  String get openChats => 'Chats ouverts';

  @override
  String get todayLeads => 'Prospects du jour';

  @override
  String get todayMessages => 'Messages du jour';

  @override
  String get conversation => 'Conversation';

  @override
  String get publicConversation => 'Conversation publique';

  @override
  String get noConversations => 'Aucune conversation';

  @override
  String get conversationsAppearHere =>
      'Les conversations CRM dans votre périmètre apparaissent ici.';

  @override
  String get conversationUnavailable => 'Conversation indisponible';

  @override
  String get conversationsUnavailable => 'Conversations indisponibles';

  @override
  String get crmConversation => 'Conversation CRM';

  @override
  String get shareLink => 'Lien de partage';

  @override
  String get publicShareToken => 'Jeton public de partage';

  @override
  String get noMessagesYet => 'Aucun message pour le moment';

  @override
  String get messagesAppearHere =>
      'Les messages de cette conversation apparaissent ici.';

  @override
  String get messagesUnavailable => 'Messages indisponibles';

  @override
  String get writeMessage => 'Écrire un message';

  @override
  String get updateConversationStatus =>
      'Mettre à jour le statut de la conversation';

  @override
  String get conversationStatusUpdated =>
      'Statut de la conversation mis à jour.';

  @override
  String get open => 'Ouverte';

  @override
  String get closed => 'Fermée';

  @override
  String get archived => 'Archivée';

  @override
  String get thisSharedConversation =>
      'Cette conversation partagée affiche uniquement les champs de chat publics et sûrs.';

  @override
  String get publicSafeMessagesAppearHere =>
      'Les messages publics et sûrs de cette conversation apparaissent ici.';

  @override
  String get conversationClosed => 'Cette conversation est fermée.';

  @override
  String get reply => 'Répondre';

  @override
  String get yourNameOptional => 'Votre nom facultatif';

  @override
  String get message => 'Message';

  @override
  String get writePlainTextReply => 'Écrire une réponse en texte simple';

  @override
  String get sendReply => 'Envoyer la réponse';

  @override
  String get messageSent => 'Message envoyé.';

  @override
  String get enterMessageBeforeSending => 'Saisissez un message avant l’envoi.';

  @override
  String get messageTooLong =>
      'Le message est trop long. Limitez-le à 2000 caractères.';

  @override
  String get conversationLinkUnavailable =>
      'Ce lien de conversation n’est plus disponible.';

  @override
  String get tooManyMessages => 'Trop de messages. Réessayez dans un instant.';

  @override
  String get checkMessageTryAgain => 'Vérifiez votre message puis réessayez.';

  @override
  String get couldNotSendMessage =>
      'Impossible d’envoyer votre message. Réessayez.';

  @override
  String get signedIn => 'Connecté';

  @override
  String get role => 'Rôle';

  @override
  String get organization => 'Organisation';

  @override
  String get brokerProfile => 'Profil courtier';

  @override
  String get myLeadClaims => 'Mes demandes prospects';

  @override
  String get reservationRequests => 'Demandes de réservation';

  @override
  String get myDeals => 'Mes ventes';

  @override
  String get myCommissions => 'Mes commissions';

  @override
  String get editPlaceholder => 'Édition provisoire';

  @override
  String get editBrokerProfile => 'Modifier le profil courtier';

  @override
  String get brokerProfileUnavailable => 'Profil courtier indisponible';

  @override
  String get brokerProfileBackendReady =>
      'Cet écran est prêt pour GET /broker-profile/me lorsque le backend l’exposera.';

  @override
  String get editProfileInactive =>
      'La modification du profil n’est pas encore active';

  @override
  String get profileUpdateApisUnavailable =>
      'Les API de mise à jour du profil ne font pas partie du périmètre backend actuel.';

  @override
  String get license => 'Licence';

  @override
  String get phone => 'Téléphone';

  @override
  String get country => 'Pays';

  @override
  String get experience => 'Expérience';

  @override
  String yearsExperience(Object count) {
    return '$count ans';
  }

  @override
  String get noReservationRequests => 'Aucune demande de réservation';

  @override
  String get createRequestFromLeadClaim =>
      'Créez une demande depuis une demande prospect active.';

  @override
  String get requestsUnavailable => 'Demandes indisponibles';

  @override
  String get reservationRequest => 'Demande de réservation';

  @override
  String get reservationRequestCancelled => 'Demande de réservation annulée.';

  @override
  String get dealRoomCreated => 'Salon de vente créé.';

  @override
  String get createDealRoom => 'Créer un salon de vente';

  @override
  String get cancelRequest => 'Annuler la demande';

  @override
  String get requestUnavailable => 'Demande indisponible';

  @override
  String get approved => 'Approuvé';

  @override
  String get rejected => 'Rejeté';

  @override
  String get cancelled => 'Annulé';

  @override
  String get reason => 'Motif';

  @override
  String get notes => 'Notes';

  @override
  String unitLabel(Object value) {
    return 'Unité : $value';
  }

  @override
  String get submitReservationRequest => 'Envoyer la demande de réservation';

  @override
  String reservationRequestStatus(Object status) {
    return 'Demande de réservation $status.';
  }

  @override
  String get noDealRooms => 'Aucun salon de vente';

  @override
  String get dealRoomsAppearHere =>
      'Les salons de vente apparaissent ici après l’ouverture d’une réservation approuvée.';

  @override
  String get dealRoomsUnavailable => 'Salons de vente indisponibles';

  @override
  String get dealRoomNotFound => 'Salon de vente introuvable';

  @override
  String get dealRoomAccessDenied =>
      'Vous n’avez pas accès à ce salon de vente';

  @override
  String get couldNotLoadDealRoomTryAgain =>
      'Impossible de charger le salon de vente. Réessayez.';

  @override
  String get dealRoom => 'Salon de vente';

  @override
  String get dealRoomActions => 'Actions du salon';

  @override
  String get moveToNegotiation => 'Passer en négociation';

  @override
  String get moveToPendingApproval => 'Passer en attente d’approbation';

  @override
  String get inviteClient => 'Inviter le client';

  @override
  String get clientInviteCreated => 'Invitation client créée.';

  @override
  String dealRoomMovedTo(Object status) {
    return 'Salon de vente déplacé vers $status.';
  }

  @override
  String get participants => 'Participants';

  @override
  String get noParticipantsYet => 'Aucun participant retourné pour le moment.';

  @override
  String get clientInvite => 'Invitation client';

  @override
  String get notInvited => 'Non invité';

  @override
  String get messages => 'Messages';

  @override
  String get messagesAndStatusAppearHere =>
      'Les messages et mises à jour de statut apparaissent ici.';

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
    return '$count messages · ouvert le $date';
  }

  @override
  String reservationStatus(Object status) {
    return 'Réservation $status';
  }

  @override
  String get leadClaim => 'Demande prospect';

  @override
  String get noLeadClaims => 'Aucune demande prospect';

  @override
  String get createClaimFromProjectOrUnit =>
      'Créez une demande depuis l’écran de détail d’un projet ou d’une unité.';

  @override
  String get claimsUnavailable => 'Demandes indisponibles';

  @override
  String get claimUnavailable => 'Demande indisponible';

  @override
  String get leadClaimReleased => 'Demande prospect libérée.';

  @override
  String get createReservationRequest => 'Créer une demande de réservation';

  @override
  String get releaseClaim => 'Libérer la demande';

  @override
  String get client => 'Client';

  @override
  String get noUnitSelected => 'Aucune unité sélectionnée';

  @override
  String get released => 'Libérée';

  @override
  String get clientName => 'Nom du client';

  @override
  String get clientNameRequired => 'Le nom du client est requis';

  @override
  String get clientPhone => 'Téléphone du client';

  @override
  String get clientPhoneRequired => 'Le téléphone du client est requis';

  @override
  String get sourceManual => 'Source : MANUAL';

  @override
  String get leadClaimCreated => 'Demande prospect créée.';

  @override
  String get clientAlreadyRegistered =>
      'Ce client est déjà enregistré pour ce projet.';

  @override
  String get deal => 'Vente';

  @override
  String get noDealsYet => 'Aucune vente pour le moment';

  @override
  String get dealsAppearHere =>
      'Les ventes approuvées et vendues dans votre périmètre apparaissent ici.';

  @override
  String get dealsUnavailable => 'Ventes indisponibles';

  @override
  String get dealUnavailable => 'Vente indisponible';

  @override
  String get dealRoomLabel => 'Salon de vente';

  @override
  String get broker => 'Courtier';

  @override
  String get brokerage => 'Agence';

  @override
  String get openDealRoom => 'Ouvrir le salon de vente';

  @override
  String roomShortId(Object id) {
    return 'Salon $id';
  }

  @override
  String get commission => 'Commission';

  @override
  String get noCommissionsYet => 'Aucune commission pour le moment';

  @override
  String get commissionsAppearHere =>
      'Les écritures de commission dans votre périmètre apparaissent ici.';

  @override
  String get commissionsUnavailable => 'Commissions indisponibles';

  @override
  String get commissionUnavailable => 'Commission indisponible';

  @override
  String get openDeal => 'Ouvrir la vente';

  @override
  String get routeNotFound => 'Route introuvable';

  @override
  String get openProjectOrUnitFirst =>
      'Ouvrez d’abord un projet ou une unité, puis créez la demande.';

  @override
  String get openActiveLeadClaimFirst =>
      'Ouvrez d’abord une demande prospect active, puis créez la demande.';

  @override
  String get continueAsGuest => 'Continuer en invité';

  @override
  String get continueBrowsing => 'Continuer la navigation';

  @override
  String get guestMarketplaceTitle => 'Parcourir en invité';

  @override
  String get guestMarketplaceMessage =>
      'Explorez les projets publics sans vous connecter. Connectez-vous lorsque vous avez besoin des outils d’espace de travail ou d’actions protégées.';

  @override
  String get signInToRequest => 'Connectez-vous pour envoyer la demande';
}
