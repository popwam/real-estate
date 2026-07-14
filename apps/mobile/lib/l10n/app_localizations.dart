import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_ar.dart';
import 'app_localizations_en.dart';
import 'app_localizations_fr.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('ar'),
    Locale('en'),
    Locale('fr'),
  ];

  /// No description provided for @appTitle.
  ///
  /// In en, this message translates to:
  /// **'POPWAM'**
  String get appTitle;

  /// No description provided for @appTagline.
  ///
  /// In en, this message translates to:
  /// **'Verified real estate marketplace'**
  String get appTagline;

  /// No description provided for @language.
  ///
  /// In en, this message translates to:
  /// **'Language'**
  String get language;

  /// No description provided for @english.
  ///
  /// In en, this message translates to:
  /// **'English'**
  String get english;

  /// No description provided for @arabic.
  ///
  /// In en, this message translates to:
  /// **'Arabic'**
  String get arabic;

  /// No description provided for @french.
  ///
  /// In en, this message translates to:
  /// **'French'**
  String get french;

  /// No description provided for @emailOrPhone.
  ///
  /// In en, this message translates to:
  /// **'Email or phone'**
  String get emailOrPhone;

  /// No description provided for @emailOrPhoneRequired.
  ///
  /// In en, this message translates to:
  /// **'Email or phone is required'**
  String get emailOrPhoneRequired;

  /// No description provided for @password.
  ///
  /// In en, this message translates to:
  /// **'Password'**
  String get password;

  /// No description provided for @passwordRequired.
  ///
  /// In en, this message translates to:
  /// **'Password is required'**
  String get passwordRequired;

  /// No description provided for @signIn.
  ///
  /// In en, this message translates to:
  /// **'Sign in'**
  String get signIn;

  /// No description provided for @invalidLoginDetails.
  ///
  /// In en, this message translates to:
  /// **'Invalid login details'**
  String get invalidLoginDetails;

  /// No description provided for @networkError.
  ///
  /// In en, this message translates to:
  /// **'Network error'**
  String get networkError;

  /// No description provided for @requestTimedOut.
  ///
  /// In en, this message translates to:
  /// **'The API is taking too long to respond. Please check your connection and try again.'**
  String get requestTimedOut;

  /// No description provided for @couldNotReachApi.
  ///
  /// In en, this message translates to:
  /// **'Could not reach the API. Check your internet connection or API environment.'**
  String get couldNotReachApi;

  /// No description provided for @secureConnectionError.
  ///
  /// In en, this message translates to:
  /// **'The secure connection could not be verified. Please contact support.'**
  String get secureConnectionError;

  /// No description provided for @requestCancelled.
  ///
  /// In en, this message translates to:
  /// **'The request was cancelled. Please try again.'**
  String get requestCancelled;

  /// No description provided for @sessionExpired.
  ///
  /// In en, this message translates to:
  /// **'Your session expired. Please sign in again.'**
  String get sessionExpired;

  /// No description provided for @workspaceAccessDenied.
  ///
  /// In en, this message translates to:
  /// **'You do not have access to this mobile workspace.'**
  String get workspaceAccessDenied;

  /// No description provided for @mobileResourceNotFound.
  ///
  /// In en, this message translates to:
  /// **'The requested mobile resource was not found.'**
  String get mobileResourceNotFound;

  /// No description provided for @requestFailed.
  ///
  /// In en, this message translates to:
  /// **'Request failed'**
  String get requestFailed;

  /// No description provided for @projects.
  ///
  /// In en, this message translates to:
  /// **'Projects'**
  String get projects;

  /// No description provided for @searchProjects.
  ///
  /// In en, this message translates to:
  /// **'Search projects'**
  String get searchProjects;

  /// No description provided for @projectDetails.
  ///
  /// In en, this message translates to:
  /// **'Project details'**
  String get projectDetails;

  /// No description provided for @requestDetails.
  ///
  /// In en, this message translates to:
  /// **'Request details'**
  String get requestDetails;

  /// No description provided for @leads.
  ///
  /// In en, this message translates to:
  /// **'Leads'**
  String get leads;

  /// No description provided for @conversations.
  ///
  /// In en, this message translates to:
  /// **'Conversations'**
  String get conversations;

  /// No description provided for @dealRooms.
  ///
  /// In en, this message translates to:
  /// **'Deal rooms'**
  String get dealRooms;

  /// No description provided for @reservations.
  ///
  /// In en, this message translates to:
  /// **'Reservations'**
  String get reservations;

  /// No description provided for @attendance.
  ///
  /// In en, this message translates to:
  /// **'Attendance'**
  String get attendance;

  /// No description provided for @profile.
  ///
  /// In en, this message translates to:
  /// **'Profile'**
  String get profile;

  /// No description provided for @settings.
  ///
  /// In en, this message translates to:
  /// **'Settings'**
  String get settings;

  /// No description provided for @logout.
  ///
  /// In en, this message translates to:
  /// **'Logout'**
  String get logout;

  /// No description provided for @loading.
  ///
  /// In en, this message translates to:
  /// **'Loading'**
  String get loading;

  /// No description provided for @noResultsYet.
  ///
  /// In en, this message translates to:
  /// **'No results yet'**
  String get noResultsYet;

  /// No description provided for @tryAgain.
  ///
  /// In en, this message translates to:
  /// **'Try again'**
  String get tryAgain;

  /// No description provided for @retry.
  ///
  /// In en, this message translates to:
  /// **'Retry'**
  String get retry;

  /// No description provided for @sendMessage.
  ///
  /// In en, this message translates to:
  /// **'Send message'**
  String get sendMessage;

  /// No description provided for @send.
  ///
  /// In en, this message translates to:
  /// **'Send'**
  String get send;

  /// No description provided for @sending.
  ///
  /// In en, this message translates to:
  /// **'Sending'**
  String get sending;

  /// No description provided for @dismiss.
  ///
  /// In en, this message translates to:
  /// **'Dismiss'**
  String get dismiss;

  /// No description provided for @marketplace.
  ///
  /// In en, this message translates to:
  /// **'Marketplace'**
  String get marketplace;

  /// No description provided for @units.
  ///
  /// In en, this message translates to:
  /// **'Units'**
  String get units;

  /// No description provided for @map.
  ///
  /// In en, this message translates to:
  /// **'Map'**
  String get map;

  /// No description provided for @refreshProjects.
  ///
  /// In en, this message translates to:
  /// **'Refresh projects'**
  String get refreshProjects;

  /// No description provided for @refreshUnits.
  ///
  /// In en, this message translates to:
  /// **'Refresh units'**
  String get refreshUnits;

  /// No description provided for @refreshMapSearch.
  ///
  /// In en, this message translates to:
  /// **'Refresh map search'**
  String get refreshMapSearch;

  /// No description provided for @refreshRequests.
  ///
  /// In en, this message translates to:
  /// **'Refresh requests'**
  String get refreshRequests;

  /// No description provided for @refreshDealRooms.
  ///
  /// In en, this message translates to:
  /// **'Refresh deal rooms'**
  String get refreshDealRooms;

  /// No description provided for @refreshDeals.
  ///
  /// In en, this message translates to:
  /// **'Refresh deals'**
  String get refreshDeals;

  /// No description provided for @refreshCommissions.
  ///
  /// In en, this message translates to:
  /// **'Refresh commissions'**
  String get refreshCommissions;

  /// No description provided for @refreshAttendance.
  ///
  /// In en, this message translates to:
  /// **'Refresh attendance'**
  String get refreshAttendance;

  /// No description provided for @refreshConversations.
  ///
  /// In en, this message translates to:
  /// **'Refresh conversations'**
  String get refreshConversations;

  /// No description provided for @refreshLead.
  ///
  /// In en, this message translates to:
  /// **'Refresh lead'**
  String get refreshLead;

  /// No description provided for @refreshCrmLeads.
  ///
  /// In en, this message translates to:
  /// **'Refresh CRM leads'**
  String get refreshCrmLeads;

  /// No description provided for @refreshMarketplaceCrmLeads.
  ///
  /// In en, this message translates to:
  /// **'Refresh marketplace CRM leads'**
  String get refreshMarketplaceCrmLeads;

  /// No description provided for @refreshCrmSummary.
  ///
  /// In en, this message translates to:
  /// **'Refresh CRM summary'**
  String get refreshCrmSummary;

  /// No description provided for @filters.
  ///
  /// In en, this message translates to:
  /// **'Filters'**
  String get filters;

  /// No description provided for @closeFilters.
  ///
  /// In en, this message translates to:
  /// **'Close filters'**
  String get closeFilters;

  /// No description provided for @marketplaceFilters.
  ///
  /// In en, this message translates to:
  /// **'Marketplace filters'**
  String get marketplaceFilters;

  /// No description provided for @city.
  ///
  /// In en, this message translates to:
  /// **'City'**
  String get city;

  /// No description provided for @district.
  ///
  /// In en, this message translates to:
  /// **'District'**
  String get district;

  /// No description provided for @unitType.
  ///
  /// In en, this message translates to:
  /// **'Unit type'**
  String get unitType;

  /// No description provided for @minPrice.
  ///
  /// In en, this message translates to:
  /// **'Min price'**
  String get minPrice;

  /// No description provided for @maxPrice.
  ///
  /// In en, this message translates to:
  /// **'Max price'**
  String get maxPrice;

  /// No description provided for @bedrooms.
  ///
  /// In en, this message translates to:
  /// **'Bedrooms'**
  String get bedrooms;

  /// No description provided for @bathrooms.
  ///
  /// In en, this message translates to:
  /// **'Bathrooms'**
  String get bathrooms;

  /// No description provided for @minArea.
  ///
  /// In en, this message translates to:
  /// **'Min area'**
  String get minArea;

  /// No description provided for @maxArea.
  ///
  /// In en, this message translates to:
  /// **'Max area'**
  String get maxArea;

  /// No description provided for @clear.
  ///
  /// In en, this message translates to:
  /// **'Clear'**
  String get clear;

  /// No description provided for @apply.
  ///
  /// In en, this message translates to:
  /// **'Apply'**
  String get apply;

  /// No description provided for @noVisibleProjects.
  ///
  /// In en, this message translates to:
  /// **'No visible projects'**
  String get noVisibleProjects;

  /// No description provided for @projectsAppearHere.
  ///
  /// In en, this message translates to:
  /// **'Projects appear here when the API exposes them to you.'**
  String get projectsAppearHere;

  /// No description provided for @projectsUnavailable.
  ///
  /// In en, this message translates to:
  /// **'Projects unavailable'**
  String get projectsUnavailable;

  /// No description provided for @noVisibleUnits.
  ///
  /// In en, this message translates to:
  /// **'No visible units'**
  String get noVisibleUnits;

  /// No description provided for @availableInventoryAppearsHere.
  ///
  /// In en, this message translates to:
  /// **'Available inventory appears here after API visibility checks.'**
  String get availableInventoryAppearsHere;

  /// No description provided for @unitsUnavailable.
  ///
  /// In en, this message translates to:
  /// **'Units unavailable'**
  String get unitsUnavailable;

  /// No description provided for @project.
  ///
  /// In en, this message translates to:
  /// **'Project'**
  String get project;

  /// No description provided for @unit.
  ///
  /// In en, this message translates to:
  /// **'Unit'**
  String get unit;

  /// No description provided for @images.
  ///
  /// In en, this message translates to:
  /// **'Images'**
  String get images;

  /// No description provided for @paymentPlans.
  ///
  /// In en, this message translates to:
  /// **'Payment plans'**
  String get paymentPlans;

  /// No description provided for @paymentDetails.
  ///
  /// In en, this message translates to:
  /// **'Payment details'**
  String get paymentDetails;

  /// No description provided for @availableUnits.
  ///
  /// In en, this message translates to:
  /// **'Available units'**
  String get availableUnits;

  /// No description provided for @createLeadClaim.
  ///
  /// In en, this message translates to:
  /// **'Create lead claim'**
  String get createLeadClaim;

  /// No description provided for @noUnitsVisible.
  ///
  /// In en, this message translates to:
  /// **'No units visible'**
  String get noUnitsVisible;

  /// No description provided for @backendDidNotExposeUnits.
  ///
  /// In en, this message translates to:
  /// **'The backend did not expose units for this project.'**
  String get backendDidNotExposeUnits;

  /// No description provided for @projectUnavailable.
  ///
  /// In en, this message translates to:
  /// **'Project unavailable'**
  String get projectUnavailable;

  /// No description provided for @unitUnavailable.
  ///
  /// In en, this message translates to:
  /// **'Unit unavailable'**
  String get unitUnavailable;

  /// No description provided for @developerLabel.
  ///
  /// In en, this message translates to:
  /// **'Developer: {name}'**
  String developerLabel(Object name);

  /// No description provided for @status.
  ///
  /// In en, this message translates to:
  /// **'Status'**
  String get status;

  /// No description provided for @visibility.
  ///
  /// In en, this message translates to:
  /// **'Visibility'**
  String get visibility;

  /// No description provided for @type.
  ///
  /// In en, this message translates to:
  /// **'Type'**
  String get type;

  /// No description provided for @area.
  ///
  /// In en, this message translates to:
  /// **'Area'**
  String get area;

  /// No description provided for @floor.
  ///
  /// In en, this message translates to:
  /// **'Floor'**
  String get floor;

  /// No description provided for @projectPending.
  ///
  /// In en, this message translates to:
  /// **'Project pending'**
  String get projectPending;

  /// No description provided for @locationPending.
  ///
  /// In en, this message translates to:
  /// **'Location pending'**
  String get locationPending;

  /// No description provided for @priceOnRequest.
  ///
  /// In en, this message translates to:
  /// **'Price on request'**
  String get priceOnRequest;

  /// No description provided for @amountPending.
  ///
  /// In en, this message translates to:
  /// **'Amount pending'**
  String get amountPending;

  /// No description provided for @fromPrice.
  ///
  /// In en, this message translates to:
  /// **'From {price}'**
  String fromPrice(Object price);

  /// No description provided for @unitsCount.
  ///
  /// In en, this message translates to:
  /// **'{count} units'**
  String unitsCount(Object count);

  /// No description provided for @bedCount.
  ///
  /// In en, this message translates to:
  /// **'{count} bed'**
  String bedCount(Object count);

  /// No description provided for @sqmValue.
  ///
  /// In en, this message translates to:
  /// **'{value} sqm'**
  String sqmValue(Object value);

  /// No description provided for @noPaymentPlans.
  ///
  /// In en, this message translates to:
  /// **'No payment plans returned yet.'**
  String get noPaymentPlans;

  /// No description provided for @downPaymentPercent.
  ///
  /// In en, this message translates to:
  /// **'{value}% down'**
  String downPaymentPercent(Object value);

  /// No description provided for @installmentsCount.
  ///
  /// In en, this message translates to:
  /// **'{count} installments'**
  String installmentsCount(Object count);

  /// No description provided for @yearsCount.
  ///
  /// In en, this message translates to:
  /// **'{count} years'**
  String yearsCount(Object count);

  /// No description provided for @mapSearch.
  ///
  /// In en, this message translates to:
  /// **'Map search'**
  String get mapSearch;

  /// No description provided for @mapPlaceholder.
  ///
  /// In en, this message translates to:
  /// **'Map UI placeholder using backend bbox search.'**
  String get mapPlaceholder;

  /// No description provided for @noMapResults.
  ///
  /// In en, this message translates to:
  /// **'No map results'**
  String get noMapResults;

  /// No description provided for @mapResultsAppearHere.
  ///
  /// In en, this message translates to:
  /// **'Visible projects inside the bbox will appear here.'**
  String get mapResultsAppearHere;

  /// No description provided for @mapSearchUnavailable.
  ///
  /// In en, this message translates to:
  /// **'Map search unavailable'**
  String get mapSearchUnavailable;

  /// No description provided for @crmLeads.
  ///
  /// In en, this message translates to:
  /// **'CRM leads'**
  String get crmLeads;

  /// No description provided for @marketplaceCrmLeads.
  ///
  /// In en, this message translates to:
  /// **'Marketplace CRM leads'**
  String get marketplaceCrmLeads;

  /// No description provided for @crmConversations.
  ///
  /// In en, this message translates to:
  /// **'CRM conversations'**
  String get crmConversations;

  /// No description provided for @crmLead.
  ///
  /// In en, this message translates to:
  /// **'CRM lead'**
  String get crmLead;

  /// No description provided for @noCrmLeads.
  ///
  /// In en, this message translates to:
  /// **'No CRM leads'**
  String get noCrmLeads;

  /// No description provided for @crmLeadsAppearHere.
  ///
  /// In en, this message translates to:
  /// **'Public and claimed CRM leads in your scope appear here.'**
  String get crmLeadsAppearHere;

  /// No description provided for @crmLeadsUnavailable.
  ///
  /// In en, this message translates to:
  /// **'CRM leads unavailable'**
  String get crmLeadsUnavailable;

  /// No description provided for @noMarketplaceCrmLeads.
  ///
  /// In en, this message translates to:
  /// **'No marketplace CRM leads'**
  String get noMarketplaceCrmLeads;

  /// No description provided for @marketplaceCrmLeadsAppearHere.
  ///
  /// In en, this message translates to:
  /// **'Claimable CRM leads appear here when available.'**
  String get marketplaceCrmLeadsAppearHere;

  /// No description provided for @marketplaceCrmLeadsUnavailable.
  ///
  /// In en, this message translates to:
  /// **'Marketplace CRM leads unavailable'**
  String get marketplaceCrmLeadsUnavailable;

  /// No description provided for @maskedLead.
  ///
  /// In en, this message translates to:
  /// **'Masked lead'**
  String get maskedLead;

  /// No description provided for @phoneEnding.
  ///
  /// In en, this message translates to:
  /// **'Phone ending {digits}'**
  String phoneEnding(Object digits);

  /// No description provided for @noProjectAttached.
  ///
  /// In en, this message translates to:
  /// **'No project attached'**
  String get noProjectAttached;

  /// No description provided for @createdAt.
  ///
  /// In en, this message translates to:
  /// **'Created {date}'**
  String createdAt(Object date);

  /// No description provided for @updatedAt.
  ///
  /// In en, this message translates to:
  /// **'Updated {date}'**
  String updatedAt(Object date);

  /// No description provided for @expiresAt.
  ///
  /// In en, this message translates to:
  /// **'Expires {date}'**
  String expiresAt(Object date);

  /// No description provided for @expires.
  ///
  /// In en, this message translates to:
  /// **'Expires'**
  String get expires;

  /// No description provided for @soldAt.
  ///
  /// In en, this message translates to:
  /// **'Sold {date}'**
  String soldAt(Object date);

  /// No description provided for @sold.
  ///
  /// In en, this message translates to:
  /// **'Sold'**
  String get sold;

  /// No description provided for @openedAt.
  ///
  /// In en, this message translates to:
  /// **'opened {date}'**
  String openedAt(Object date);

  /// No description provided for @claimed.
  ///
  /// In en, this message translates to:
  /// **'Claimed'**
  String get claimed;

  /// No description provided for @unclaimed.
  ///
  /// In en, this message translates to:
  /// **'Unclaimed'**
  String get unclaimed;

  /// No description provided for @unavailable.
  ///
  /// In en, this message translates to:
  /// **'Unavailable'**
  String get unavailable;

  /// No description provided for @all.
  ///
  /// In en, this message translates to:
  /// **'All'**
  String get all;

  /// No description provided for @newStatus.
  ///
  /// In en, this message translates to:
  /// **'New'**
  String get newStatus;

  /// No description provided for @inChat.
  ///
  /// In en, this message translates to:
  /// **'In chat'**
  String get inChat;

  /// No description provided for @qualified.
  ///
  /// In en, this message translates to:
  /// **'Qualified'**
  String get qualified;

  /// No description provided for @lost.
  ///
  /// In en, this message translates to:
  /// **'Lost'**
  String get lost;

  /// No description provided for @converted.
  ///
  /// In en, this message translates to:
  /// **'Converted'**
  String get converted;

  /// No description provided for @spam.
  ///
  /// In en, this message translates to:
  /// **'Spam'**
  String get spam;

  /// No description provided for @contact.
  ///
  /// In en, this message translates to:
  /// **'Contact'**
  String get contact;

  /// No description provided for @call.
  ///
  /// In en, this message translates to:
  /// **'Call'**
  String get call;

  /// No description provided for @chat.
  ///
  /// In en, this message translates to:
  /// **'Chat'**
  String get chat;

  /// No description provided for @whatsApp.
  ///
  /// In en, this message translates to:
  /// **'WhatsApp'**
  String get whatsApp;

  /// No description provided for @actions.
  ///
  /// In en, this message translates to:
  /// **'Actions'**
  String get actions;

  /// No description provided for @openConversation.
  ///
  /// In en, this message translates to:
  /// **'Open conversation'**
  String get openConversation;

  /// No description provided for @claimLead.
  ///
  /// In en, this message translates to:
  /// **'Claim lead'**
  String get claimLead;

  /// No description provided for @claim.
  ///
  /// In en, this message translates to:
  /// **'Claim'**
  String get claim;

  /// No description provided for @updateStatus.
  ///
  /// In en, this message translates to:
  /// **'Update status'**
  String get updateStatus;

  /// No description provided for @attendanceToday.
  ///
  /// In en, this message translates to:
  /// **'Today'**
  String get attendanceToday;

  /// No description provided for @attendanceHistory.
  ///
  /// In en, this message translates to:
  /// **'Recent attendance'**
  String get attendanceHistory;

  /// No description provided for @attendanceUnavailable.
  ///
  /// In en, this message translates to:
  /// **'Attendance unavailable'**
  String get attendanceUnavailable;

  /// No description provided for @attendanceDate.
  ///
  /// In en, this message translates to:
  /// **'Date'**
  String get attendanceDate;

  /// No description provided for @attendanceDuration.
  ///
  /// In en, this message translates to:
  /// **'Duration'**
  String get attendanceDuration;

  /// No description provided for @checkIn.
  ///
  /// In en, this message translates to:
  /// **'Check in'**
  String get checkIn;

  /// No description provided for @checkOut.
  ///
  /// In en, this message translates to:
  /// **'Check out'**
  String get checkOut;

  /// No description provided for @checkInTime.
  ///
  /// In en, this message translates to:
  /// **'Check-in'**
  String get checkInTime;

  /// No description provided for @checkOutTime.
  ///
  /// In en, this message translates to:
  /// **'Check-out'**
  String get checkOutTime;

  /// No description provided for @attendanceCompletedToday.
  ///
  /// In en, this message translates to:
  /// **'Attendance completed today'**
  String get attendanceCompletedToday;

  /// No description provided for @attendanceNote.
  ///
  /// In en, this message translates to:
  /// **'Note'**
  String get attendanceNote;

  /// No description provided for @durationMinutes.
  ///
  /// In en, this message translates to:
  /// **'{count} min'**
  String durationMinutes(Object count);

  /// No description provided for @noAttendanceHistory.
  ///
  /// In en, this message translates to:
  /// **'No attendance history'**
  String get noAttendanceHistory;

  /// No description provided for @attendanceHistoryAppearsHere.
  ///
  /// In en, this message translates to:
  /// **'Your recent check-in and check-out records appear here.'**
  String get attendanceHistoryAppearsHere;

  /// No description provided for @noEmployeeProfileLinked.
  ///
  /// In en, this message translates to:
  /// **'No employee profile is linked to this account.'**
  String get noEmployeeProfileLinked;

  /// No description provided for @companyAwaitingVerification.
  ///
  /// In en, this message translates to:
  /// **'The organization is awaiting platform review and activation.'**
  String get companyAwaitingVerification;

  /// No description provided for @alreadyCheckedIn.
  ///
  /// In en, this message translates to:
  /// **'You are already checked in.'**
  String get alreadyCheckedIn;

  /// No description provided for @checkInBeforeCheckOut.
  ///
  /// In en, this message translates to:
  /// **'You must check in before checking out.'**
  String get checkInBeforeCheckOut;

  /// No description provided for @attendanceVerificationStatus.
  ///
  /// In en, this message translates to:
  /// **'Verification'**
  String get attendanceVerificationStatus;

  /// No description provided for @attendanceDvrStatus.
  ///
  /// In en, this message translates to:
  /// **'DVR review'**
  String get attendanceDvrStatus;

  /// No description provided for @attendanceFailureReasons.
  ///
  /// In en, this message translates to:
  /// **'Failure reasons'**
  String get attendanceFailureReasons;

  /// No description provided for @attendanceSecureChecks.
  ///
  /// In en, this message translates to:
  /// **'Secure checks'**
  String get attendanceSecureChecks;

  /// No description provided for @attendanceNativeChecksUnavailable.
  ///
  /// In en, this message translates to:
  /// **'Native location, Wi-Fi, camera, and device-integrity checks need the secure mobile build. The API will enforce configured company policy when evidence is supplied.'**
  String get attendanceNativeChecksUnavailable;

  /// No description provided for @attendanceNativeChecksActive.
  ///
  /// In en, this message translates to:
  /// **'This secure build collects GPS location, Wi-Fi details where the OS allows it, device-integrity signals, and a live camera photo before sending attendance to the API.'**
  String get attendanceNativeChecksActive;

  /// No description provided for @collectingAttendanceEvidence.
  ///
  /// In en, this message translates to:
  /// **'Collecting secure evidence'**
  String get collectingAttendanceEvidence;

  /// No description provided for @attendanceEvidenceWarnings.
  ///
  /// In en, this message translates to:
  /// **'Evidence warnings'**
  String get attendanceEvidenceWarnings;

  /// No description provided for @attendanceLocationPermissionDenied.
  ///
  /// In en, this message translates to:
  /// **'Location permission was denied.'**
  String get attendanceLocationPermissionDenied;

  /// No description provided for @attendanceLocationServiceDisabled.
  ///
  /// In en, this message translates to:
  /// **'Location services are disabled.'**
  String get attendanceLocationServiceDisabled;

  /// No description provided for @attendanceWifiUnavailable.
  ///
  /// In en, this message translates to:
  /// **'The phone is not connected to Wi-Fi.'**
  String get attendanceWifiUnavailable;

  /// No description provided for @attendanceWifiRestricted.
  ///
  /// In en, this message translates to:
  /// **'Wi-Fi SSID/BSSID is unavailable on this device or OS.'**
  String get attendanceWifiRestricted;

  /// No description provided for @attendanceCameraPermissionDenied.
  ///
  /// In en, this message translates to:
  /// **'Camera permission was denied.'**
  String get attendanceCameraPermissionDenied;

  /// No description provided for @attendancePhotoCaptureCancelled.
  ///
  /// In en, this message translates to:
  /// **'Live photo capture was cancelled.'**
  String get attendancePhotoCaptureCancelled;

  /// No description provided for @attendancePhotoUploadFailed.
  ///
  /// In en, this message translates to:
  /// **'Live photo upload failed. Please try again.'**
  String get attendancePhotoUploadFailed;

  /// No description provided for @attendanceCapturingPhoto.
  ///
  /// In en, this message translates to:
  /// **'Capturing live photo'**
  String get attendanceCapturingPhoto;

  /// No description provided for @attendancePhotoCaptured.
  ///
  /// In en, this message translates to:
  /// **'Photo captured'**
  String get attendancePhotoCaptured;

  /// No description provided for @attendanceUploadingPhoto.
  ///
  /// In en, this message translates to:
  /// **'Uploading attendance photo'**
  String get attendanceUploadingPhoto;

  /// No description provided for @attendancePhotoUploadSuccess.
  ///
  /// In en, this message translates to:
  /// **'Attendance photo uploaded'**
  String get attendancePhotoUploadSuccess;

  /// No description provided for @attendancePhotoTooLarge.
  ///
  /// In en, this message translates to:
  /// **'Attendance photo is too large.'**
  String get attendancePhotoTooLarge;

  /// No description provided for @attendanceInvalidPhotoType.
  ///
  /// In en, this message translates to:
  /// **'Attendance photo must be a JPEG, PNG, or WebP image.'**
  String get attendanceInvalidPhotoType;

  /// No description provided for @attendancePhotoRejected.
  ///
  /// In en, this message translates to:
  /// **'Attendance photo was rejected by the server.'**
  String get attendancePhotoRejected;

  /// No description provided for @attendanceRetryUpload.
  ///
  /// In en, this message translates to:
  /// **'Retry upload'**
  String get attendanceRetryUpload;

  /// No description provided for @attendanceDvrPending.
  ///
  /// In en, this message translates to:
  /// **'DVR review is pending.'**
  String get attendanceDvrPending;

  /// No description provided for @attendanceManualReviewRequired.
  ///
  /// In en, this message translates to:
  /// **'Manual review is required.'**
  String get attendanceManualReviewRequired;

  /// No description provided for @attendanceVerificationFailed.
  ///
  /// In en, this message translates to:
  /// **'Attendance verification failed.'**
  String get attendanceVerificationFailed;

  /// No description provided for @developerOptionsEnabled.
  ///
  /// In en, this message translates to:
  /// **'Developer options are enabled.'**
  String get developerOptionsEnabled;

  /// No description provided for @usbDebuggingEnabled.
  ///
  /// In en, this message translates to:
  /// **'USB debugging is enabled.'**
  String get usbDebuggingEnabled;

  /// No description provided for @attendanceLocationRequired.
  ///
  /// In en, this message translates to:
  /// **'Location is required.'**
  String get attendanceLocationRequired;

  /// No description provided for @attendanceLocationPolicyMissing.
  ///
  /// In en, this message translates to:
  /// **'Company attendance location is not configured.'**
  String get attendanceLocationPolicyMissing;

  /// No description provided for @outsideAllowedLocation.
  ///
  /// In en, this message translates to:
  /// **'You are outside the allowed company location.'**
  String get outsideAllowedLocation;

  /// No description provided for @attendanceWifiRequired.
  ///
  /// In en, this message translates to:
  /// **'Company Wi-Fi is required.'**
  String get attendanceWifiRequired;

  /// No description provided for @notConnectedToCompanyWifi.
  ///
  /// In en, this message translates to:
  /// **'You are not connected to the company Wi-Fi.'**
  String get notConnectedToCompanyWifi;

  /// No description provided for @attendancePhotoRequired.
  ///
  /// In en, this message translates to:
  /// **'Live office photo is required.'**
  String get attendancePhotoRequired;

  /// No description provided for @updateLeadStatus.
  ///
  /// In en, this message translates to:
  /// **'Update lead status'**
  String get updateLeadStatus;

  /// No description provided for @saveStatus.
  ///
  /// In en, this message translates to:
  /// **'Save status'**
  String get saveStatus;

  /// No description provided for @statusNoteOptional.
  ///
  /// In en, this message translates to:
  /// **'Status note optional'**
  String get statusNoteOptional;

  /// No description provided for @leadClaimed.
  ///
  /// In en, this message translates to:
  /// **'Lead claimed.'**
  String get leadClaimed;

  /// No description provided for @leadAlreadyClaimed.
  ///
  /// In en, this message translates to:
  /// **'This lead has already been claimed.'**
  String get leadAlreadyClaimed;

  /// No description provided for @leadStatusUpdated.
  ///
  /// In en, this message translates to:
  /// **'Lead status updated.'**
  String get leadStatusUpdated;

  /// No description provided for @projectLabel.
  ///
  /// In en, this message translates to:
  /// **'Project'**
  String get projectLabel;

  /// No description provided for @sourcePage.
  ///
  /// In en, this message translates to:
  /// **'Source page'**
  String get sourcePage;

  /// No description provided for @created.
  ///
  /// In en, this message translates to:
  /// **'Created'**
  String get created;

  /// No description provided for @claimedLabel.
  ///
  /// In en, this message translates to:
  /// **'Claimed'**
  String get claimedLabel;

  /// No description provided for @claimOrganization.
  ///
  /// In en, this message translates to:
  /// **'Claim organization'**
  String get claimOrganization;

  /// No description provided for @statusNote.
  ///
  /// In en, this message translates to:
  /// **'Status note'**
  String get statusNote;

  /// No description provided for @utm.
  ///
  /// In en, this message translates to:
  /// **'UTM'**
  String get utm;

  /// No description provided for @crmSummary.
  ///
  /// In en, this message translates to:
  /// **'CRM summary'**
  String get crmSummary;

  /// No description provided for @crmSummaryUnavailable.
  ///
  /// In en, this message translates to:
  /// **'CRM summary unavailable: {message}'**
  String crmSummaryUnavailable(Object message);

  /// No description provided for @totalLeads.
  ///
  /// In en, this message translates to:
  /// **'Total leads'**
  String get totalLeads;

  /// No description provided for @newLeads.
  ///
  /// In en, this message translates to:
  /// **'New'**
  String get newLeads;

  /// No description provided for @qualifiedLeads.
  ///
  /// In en, this message translates to:
  /// **'Qualified'**
  String get qualifiedLeads;

  /// No description provided for @openChats.
  ///
  /// In en, this message translates to:
  /// **'Open chats'**
  String get openChats;

  /// No description provided for @todayLeads.
  ///
  /// In en, this message translates to:
  /// **'Today leads'**
  String get todayLeads;

  /// No description provided for @todayMessages.
  ///
  /// In en, this message translates to:
  /// **'Today messages'**
  String get todayMessages;

  /// No description provided for @conversation.
  ///
  /// In en, this message translates to:
  /// **'Conversation'**
  String get conversation;

  /// No description provided for @publicConversation.
  ///
  /// In en, this message translates to:
  /// **'Public conversation'**
  String get publicConversation;

  /// No description provided for @noConversations.
  ///
  /// In en, this message translates to:
  /// **'No conversations'**
  String get noConversations;

  /// No description provided for @conversationsAppearHere.
  ///
  /// In en, this message translates to:
  /// **'CRM conversations in your scope appear here.'**
  String get conversationsAppearHere;

  /// No description provided for @conversationUnavailable.
  ///
  /// In en, this message translates to:
  /// **'Conversation unavailable'**
  String get conversationUnavailable;

  /// No description provided for @conversationsUnavailable.
  ///
  /// In en, this message translates to:
  /// **'Conversations unavailable'**
  String get conversationsUnavailable;

  /// No description provided for @crmConversation.
  ///
  /// In en, this message translates to:
  /// **'CRM conversation'**
  String get crmConversation;

  /// No description provided for @shareLink.
  ///
  /// In en, this message translates to:
  /// **'Share link'**
  String get shareLink;

  /// No description provided for @publicShareToken.
  ///
  /// In en, this message translates to:
  /// **'Public share token'**
  String get publicShareToken;

  /// No description provided for @noMessagesYet.
  ///
  /// In en, this message translates to:
  /// **'No messages yet'**
  String get noMessagesYet;

  /// No description provided for @messagesAppearHere.
  ///
  /// In en, this message translates to:
  /// **'Messages in this conversation appear here.'**
  String get messagesAppearHere;

  /// No description provided for @messagesUnavailable.
  ///
  /// In en, this message translates to:
  /// **'Messages unavailable'**
  String get messagesUnavailable;

  /// No description provided for @writeMessage.
  ///
  /// In en, this message translates to:
  /// **'Write a message'**
  String get writeMessage;

  /// No description provided for @updateConversationStatus.
  ///
  /// In en, this message translates to:
  /// **'Update conversation status'**
  String get updateConversationStatus;

  /// No description provided for @conversationStatusUpdated.
  ///
  /// In en, this message translates to:
  /// **'Conversation status updated.'**
  String get conversationStatusUpdated;

  /// No description provided for @open.
  ///
  /// In en, this message translates to:
  /// **'Open'**
  String get open;

  /// No description provided for @closed.
  ///
  /// In en, this message translates to:
  /// **'Closed'**
  String get closed;

  /// No description provided for @archived.
  ///
  /// In en, this message translates to:
  /// **'Archived'**
  String get archived;

  /// No description provided for @thisSharedConversation.
  ///
  /// In en, this message translates to:
  /// **'This shared conversation shows only public-safe chat fields.'**
  String get thisSharedConversation;

  /// No description provided for @publicSafeMessagesAppearHere.
  ///
  /// In en, this message translates to:
  /// **'Public-safe messages for this conversation appear here.'**
  String get publicSafeMessagesAppearHere;

  /// No description provided for @conversationClosed.
  ///
  /// In en, this message translates to:
  /// **'This conversation is closed.'**
  String get conversationClosed;

  /// No description provided for @reply.
  ///
  /// In en, this message translates to:
  /// **'Reply'**
  String get reply;

  /// No description provided for @yourNameOptional.
  ///
  /// In en, this message translates to:
  /// **'Your name optional'**
  String get yourNameOptional;

  /// No description provided for @message.
  ///
  /// In en, this message translates to:
  /// **'Message'**
  String get message;

  /// No description provided for @writePlainTextReply.
  ///
  /// In en, this message translates to:
  /// **'Write a plain-text reply'**
  String get writePlainTextReply;

  /// No description provided for @sendReply.
  ///
  /// In en, this message translates to:
  /// **'Send reply'**
  String get sendReply;

  /// No description provided for @messageSent.
  ///
  /// In en, this message translates to:
  /// **'Message sent.'**
  String get messageSent;

  /// No description provided for @enterMessageBeforeSending.
  ///
  /// In en, this message translates to:
  /// **'Please enter a message before sending.'**
  String get enterMessageBeforeSending;

  /// No description provided for @messageTooLong.
  ///
  /// In en, this message translates to:
  /// **'Message is too long. Please keep it under 2000 characters.'**
  String get messageTooLong;

  /// No description provided for @conversationLinkUnavailable.
  ///
  /// In en, this message translates to:
  /// **'This conversation link is no longer available.'**
  String get conversationLinkUnavailable;

  /// No description provided for @tooManyMessages.
  ///
  /// In en, this message translates to:
  /// **'Too many messages. Please try again shortly.'**
  String get tooManyMessages;

  /// No description provided for @checkMessageTryAgain.
  ///
  /// In en, this message translates to:
  /// **'Please check your message and try again.'**
  String get checkMessageTryAgain;

  /// No description provided for @couldNotSendMessage.
  ///
  /// In en, this message translates to:
  /// **'Could not send your message. Please try again.'**
  String get couldNotSendMessage;

  /// No description provided for @signedIn.
  ///
  /// In en, this message translates to:
  /// **'Signed in'**
  String get signedIn;

  /// No description provided for @role.
  ///
  /// In en, this message translates to:
  /// **'Role'**
  String get role;

  /// No description provided for @organization.
  ///
  /// In en, this message translates to:
  /// **'Organization'**
  String get organization;

  /// No description provided for @brokerProfile.
  ///
  /// In en, this message translates to:
  /// **'Broker profile'**
  String get brokerProfile;

  /// No description provided for @myLeadClaims.
  ///
  /// In en, this message translates to:
  /// **'My lead claims'**
  String get myLeadClaims;

  /// No description provided for @reservationRequests.
  ///
  /// In en, this message translates to:
  /// **'Reservation requests'**
  String get reservationRequests;

  /// No description provided for @myDeals.
  ///
  /// In en, this message translates to:
  /// **'My deals'**
  String get myDeals;

  /// No description provided for @myCommissions.
  ///
  /// In en, this message translates to:
  /// **'My commissions'**
  String get myCommissions;

  /// No description provided for @editPlaceholder.
  ///
  /// In en, this message translates to:
  /// **'Edit placeholder'**
  String get editPlaceholder;

  /// No description provided for @editBrokerProfile.
  ///
  /// In en, this message translates to:
  /// **'Edit broker profile'**
  String get editBrokerProfile;

  /// No description provided for @brokerProfileUnavailable.
  ///
  /// In en, this message translates to:
  /// **'Broker profile unavailable'**
  String get brokerProfileUnavailable;

  /// No description provided for @brokerProfileBackendReady.
  ///
  /// In en, this message translates to:
  /// **'This screen is ready for GET /broker-profile/me when the backend exposes it.'**
  String get brokerProfileBackendReady;

  /// No description provided for @editProfileInactive.
  ///
  /// In en, this message translates to:
  /// **'Edit profile is not active yet'**
  String get editProfileInactive;

  /// No description provided for @profileUpdateApisUnavailable.
  ///
  /// In en, this message translates to:
  /// **'Profile update APIs are not part of the current backend slice.'**
  String get profileUpdateApisUnavailable;

  /// No description provided for @license.
  ///
  /// In en, this message translates to:
  /// **'License'**
  String get license;

  /// No description provided for @phone.
  ///
  /// In en, this message translates to:
  /// **'Phone'**
  String get phone;

  /// No description provided for @country.
  ///
  /// In en, this message translates to:
  /// **'Country'**
  String get country;

  /// No description provided for @experience.
  ///
  /// In en, this message translates to:
  /// **'Experience'**
  String get experience;

  /// No description provided for @yearsExperience.
  ///
  /// In en, this message translates to:
  /// **'{count} years'**
  String yearsExperience(Object count);

  /// No description provided for @noReservationRequests.
  ///
  /// In en, this message translates to:
  /// **'No reservation requests'**
  String get noReservationRequests;

  /// No description provided for @createRequestFromLeadClaim.
  ///
  /// In en, this message translates to:
  /// **'Create a request from an active lead claim.'**
  String get createRequestFromLeadClaim;

  /// No description provided for @requestsUnavailable.
  ///
  /// In en, this message translates to:
  /// **'Requests unavailable'**
  String get requestsUnavailable;

  /// No description provided for @reservationRequest.
  ///
  /// In en, this message translates to:
  /// **'Reservation request'**
  String get reservationRequest;

  /// No description provided for @reservationRequestCancelled.
  ///
  /// In en, this message translates to:
  /// **'Reservation request cancelled.'**
  String get reservationRequestCancelled;

  /// No description provided for @dealRoomCreated.
  ///
  /// In en, this message translates to:
  /// **'Deal room created.'**
  String get dealRoomCreated;

  /// No description provided for @createDealRoom.
  ///
  /// In en, this message translates to:
  /// **'Create deal room'**
  String get createDealRoom;

  /// No description provided for @cancelRequest.
  ///
  /// In en, this message translates to:
  /// **'Cancel request'**
  String get cancelRequest;

  /// No description provided for @requestUnavailable.
  ///
  /// In en, this message translates to:
  /// **'Request unavailable'**
  String get requestUnavailable;

  /// No description provided for @approved.
  ///
  /// In en, this message translates to:
  /// **'Approved'**
  String get approved;

  /// No description provided for @rejected.
  ///
  /// In en, this message translates to:
  /// **'Rejected'**
  String get rejected;

  /// No description provided for @cancelled.
  ///
  /// In en, this message translates to:
  /// **'Cancelled'**
  String get cancelled;

  /// No description provided for @reason.
  ///
  /// In en, this message translates to:
  /// **'Reason'**
  String get reason;

  /// No description provided for @notes.
  ///
  /// In en, this message translates to:
  /// **'Notes'**
  String get notes;

  /// No description provided for @unitLabel.
  ///
  /// In en, this message translates to:
  /// **'Unit: {value}'**
  String unitLabel(Object value);

  /// No description provided for @submitReservationRequest.
  ///
  /// In en, this message translates to:
  /// **'Submit reservation request'**
  String get submitReservationRequest;

  /// No description provided for @reservationRequestStatus.
  ///
  /// In en, this message translates to:
  /// **'Reservation request {status}.'**
  String reservationRequestStatus(Object status);

  /// No description provided for @noDealRooms.
  ///
  /// In en, this message translates to:
  /// **'No deal rooms'**
  String get noDealRooms;

  /// No description provided for @dealRoomsAppearHere.
  ///
  /// In en, this message translates to:
  /// **'Deal rooms appear here after an approved reservation is opened.'**
  String get dealRoomsAppearHere;

  /// No description provided for @dealRoomsUnavailable.
  ///
  /// In en, this message translates to:
  /// **'Deal rooms unavailable'**
  String get dealRoomsUnavailable;

  /// No description provided for @dealRoomNotFound.
  ///
  /// In en, this message translates to:
  /// **'Deal room not found'**
  String get dealRoomNotFound;

  /// No description provided for @dealRoomAccessDenied.
  ///
  /// In en, this message translates to:
  /// **'You do not have access to this deal room'**
  String get dealRoomAccessDenied;

  /// No description provided for @couldNotLoadDealRoomTryAgain.
  ///
  /// In en, this message translates to:
  /// **'Could not load deal room. Try again.'**
  String get couldNotLoadDealRoomTryAgain;

  /// No description provided for @dealRoom.
  ///
  /// In en, this message translates to:
  /// **'Deal room'**
  String get dealRoom;

  /// No description provided for @dealRoomActions.
  ///
  /// In en, this message translates to:
  /// **'Deal room actions'**
  String get dealRoomActions;

  /// No description provided for @moveToNegotiation.
  ///
  /// In en, this message translates to:
  /// **'Move to negotiation'**
  String get moveToNegotiation;

  /// No description provided for @moveToPendingApproval.
  ///
  /// In en, this message translates to:
  /// **'Move to pending approval'**
  String get moveToPendingApproval;

  /// No description provided for @inviteClient.
  ///
  /// In en, this message translates to:
  /// **'Invite client'**
  String get inviteClient;

  /// No description provided for @clientInviteCreated.
  ///
  /// In en, this message translates to:
  /// **'Client invite created.'**
  String get clientInviteCreated;

  /// No description provided for @dealRoomMovedTo.
  ///
  /// In en, this message translates to:
  /// **'Deal room moved to {status}.'**
  String dealRoomMovedTo(Object status);

  /// No description provided for @participants.
  ///
  /// In en, this message translates to:
  /// **'Participants'**
  String get participants;

  /// No description provided for @noParticipantsYet.
  ///
  /// In en, this message translates to:
  /// **'No participants returned yet.'**
  String get noParticipantsYet;

  /// No description provided for @clientInvite.
  ///
  /// In en, this message translates to:
  /// **'Client invite'**
  String get clientInvite;

  /// No description provided for @notInvited.
  ///
  /// In en, this message translates to:
  /// **'Not invited'**
  String get notInvited;

  /// No description provided for @messages.
  ///
  /// In en, this message translates to:
  /// **'Messages'**
  String get messages;

  /// No description provided for @messagesAndStatusAppearHere.
  ///
  /// In en, this message translates to:
  /// **'Messages and status updates appear here.'**
  String get messagesAndStatusAppearHere;

  /// No description provided for @participantsCount.
  ///
  /// In en, this message translates to:
  /// **'{count} participants'**
  String participantsCount(Object count);

  /// No description provided for @messagesCount.
  ///
  /// In en, this message translates to:
  /// **'{count} messages'**
  String messagesCount(Object count);

  /// No description provided for @messagesOpenedSummary.
  ///
  /// In en, this message translates to:
  /// **'{count} messages · opened {date}'**
  String messagesOpenedSummary(Object count, Object date);

  /// No description provided for @reservationStatus.
  ///
  /// In en, this message translates to:
  /// **'Reservation {status}'**
  String reservationStatus(Object status);

  /// No description provided for @leadClaim.
  ///
  /// In en, this message translates to:
  /// **'Lead claim'**
  String get leadClaim;

  /// No description provided for @noLeadClaims.
  ///
  /// In en, this message translates to:
  /// **'No lead claims'**
  String get noLeadClaims;

  /// No description provided for @createClaimFromProjectOrUnit.
  ///
  /// In en, this message translates to:
  /// **'Create a claim from a project or unit detail screen.'**
  String get createClaimFromProjectOrUnit;

  /// No description provided for @claimsUnavailable.
  ///
  /// In en, this message translates to:
  /// **'Claims unavailable'**
  String get claimsUnavailable;

  /// No description provided for @claimUnavailable.
  ///
  /// In en, this message translates to:
  /// **'Claim unavailable'**
  String get claimUnavailable;

  /// No description provided for @leadClaimReleased.
  ///
  /// In en, this message translates to:
  /// **'Lead claim released.'**
  String get leadClaimReleased;

  /// No description provided for @createReservationRequest.
  ///
  /// In en, this message translates to:
  /// **'Create reservation request'**
  String get createReservationRequest;

  /// No description provided for @releaseClaim.
  ///
  /// In en, this message translates to:
  /// **'Release claim'**
  String get releaseClaim;

  /// No description provided for @client.
  ///
  /// In en, this message translates to:
  /// **'Client'**
  String get client;

  /// No description provided for @noUnitSelected.
  ///
  /// In en, this message translates to:
  /// **'No unit selected'**
  String get noUnitSelected;

  /// No description provided for @released.
  ///
  /// In en, this message translates to:
  /// **'Released'**
  String get released;

  /// No description provided for @clientName.
  ///
  /// In en, this message translates to:
  /// **'Client name'**
  String get clientName;

  /// No description provided for @clientNameRequired.
  ///
  /// In en, this message translates to:
  /// **'Client name is required'**
  String get clientNameRequired;

  /// No description provided for @clientPhone.
  ///
  /// In en, this message translates to:
  /// **'Client phone'**
  String get clientPhone;

  /// No description provided for @clientPhoneRequired.
  ///
  /// In en, this message translates to:
  /// **'Client phone is required'**
  String get clientPhoneRequired;

  /// No description provided for @sourceManual.
  ///
  /// In en, this message translates to:
  /// **'Source: MANUAL'**
  String get sourceManual;

  /// No description provided for @leadClaimCreated.
  ///
  /// In en, this message translates to:
  /// **'Lead claim created.'**
  String get leadClaimCreated;

  /// No description provided for @clientAlreadyRegistered.
  ///
  /// In en, this message translates to:
  /// **'This client is already registered for this project.'**
  String get clientAlreadyRegistered;

  /// No description provided for @deal.
  ///
  /// In en, this message translates to:
  /// **'Deal'**
  String get deal;

  /// No description provided for @noDealsYet.
  ///
  /// In en, this message translates to:
  /// **'No deals yet'**
  String get noDealsYet;

  /// No description provided for @dealsAppearHere.
  ///
  /// In en, this message translates to:
  /// **'Sold and approved deals scoped to you appear here.'**
  String get dealsAppearHere;

  /// No description provided for @dealsUnavailable.
  ///
  /// In en, this message translates to:
  /// **'Deals unavailable'**
  String get dealsUnavailable;

  /// No description provided for @dealUnavailable.
  ///
  /// In en, this message translates to:
  /// **'Deal unavailable'**
  String get dealUnavailable;

  /// No description provided for @dealRoomLabel.
  ///
  /// In en, this message translates to:
  /// **'Deal room'**
  String get dealRoomLabel;

  /// No description provided for @broker.
  ///
  /// In en, this message translates to:
  /// **'Broker'**
  String get broker;

  /// No description provided for @brokerage.
  ///
  /// In en, this message translates to:
  /// **'Brokerage'**
  String get brokerage;

  /// No description provided for @openDealRoom.
  ///
  /// In en, this message translates to:
  /// **'Open deal room'**
  String get openDealRoom;

  /// No description provided for @roomShortId.
  ///
  /// In en, this message translates to:
  /// **'Room {id}'**
  String roomShortId(Object id);

  /// No description provided for @commission.
  ///
  /// In en, this message translates to:
  /// **'Commission'**
  String get commission;

  /// No description provided for @noCommissionsYet.
  ///
  /// In en, this message translates to:
  /// **'No commissions yet'**
  String get noCommissionsYet;

  /// No description provided for @commissionsAppearHere.
  ///
  /// In en, this message translates to:
  /// **'Commission entries scoped to you appear here.'**
  String get commissionsAppearHere;

  /// No description provided for @commissionsUnavailable.
  ///
  /// In en, this message translates to:
  /// **'Commissions unavailable'**
  String get commissionsUnavailable;

  /// No description provided for @commissionUnavailable.
  ///
  /// In en, this message translates to:
  /// **'Commission unavailable'**
  String get commissionUnavailable;

  /// No description provided for @openDeal.
  ///
  /// In en, this message translates to:
  /// **'Open deal'**
  String get openDeal;

  /// No description provided for @routeNotFound.
  ///
  /// In en, this message translates to:
  /// **'Route not found'**
  String get routeNotFound;

  /// No description provided for @openProjectOrUnitFirst.
  ///
  /// In en, this message translates to:
  /// **'Open a project or unit first, then create the claim.'**
  String get openProjectOrUnitFirst;

  /// No description provided for @openActiveLeadClaimFirst.
  ///
  /// In en, this message translates to:
  /// **'Open an active lead claim first, then create the request.'**
  String get openActiveLeadClaimFirst;

  /// No description provided for @continueAsGuest.
  ///
  /// In en, this message translates to:
  /// **'Continue as guest'**
  String get continueAsGuest;

  /// No description provided for @continueBrowsing.
  ///
  /// In en, this message translates to:
  /// **'Continue browsing'**
  String get continueBrowsing;

  /// No description provided for @guestMarketplaceTitle.
  ///
  /// In en, this message translates to:
  /// **'Browse as a guest'**
  String get guestMarketplaceTitle;

  /// No description provided for @guestMarketplaceMessage.
  ///
  /// In en, this message translates to:
  /// **'Explore public projects without signing in. Sign in when you need workspace tools or protected actions.'**
  String get guestMarketplaceMessage;

  /// No description provided for @signInToRequest.
  ///
  /// In en, this message translates to:
  /// **'Sign in to request'**
  String get signInToRequest;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['ar', 'en', 'fr'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'ar':
      return AppLocalizationsAr();
    case 'en':
      return AppLocalizationsEn();
    case 'fr':
      return AppLocalizationsFr();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
