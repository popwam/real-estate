// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Arabic (`ar`).
class AppLocalizationsAr extends AppLocalizations {
  AppLocalizationsAr([String locale = 'ar']) : super(locale);

  @override
  String get appTitle => 'POPWAM';

  @override
  String get appTagline => 'سوق عقاري موثوق';

  @override
  String get language => 'اللغة';

  @override
  String get english => 'الإنجليزية';

  @override
  String get arabic => 'العربية';

  @override
  String get french => 'الفرنسية';

  @override
  String get emailOrPhone => 'البريد الإلكتروني أو الهاتف';

  @override
  String get emailOrPhoneRequired => 'البريد الإلكتروني أو الهاتف مطلوب';

  @override
  String get password => 'كلمة المرور';

  @override
  String get passwordRequired => 'كلمة المرور مطلوبة';

  @override
  String get signIn => 'تسجيل الدخول';

  @override
  String get invalidLoginDetails => 'بيانات تسجيل الدخول غير صحيحة';

  @override
  String get networkError => 'خطأ في الشبكة';

  @override
  String get requestTimedOut =>
      'استجابة واجهة API تستغرق وقتا طويلا. تحقق من الاتصال وحاول مرة أخرى.';

  @override
  String get couldNotReachApi =>
      'تعذر الوصول إلى واجهة API. تحقق من اتصال الإنترنت أو بيئة API.';

  @override
  String get secureConnectionError =>
      'تعذر التحقق من الاتصال الآمن. يرجى التواصل مع الدعم.';

  @override
  String get requestCancelled => 'تم إلغاء الطلب. حاول مرة أخرى.';

  @override
  String get sessionExpired => 'انتهت جلستك. يرجى تسجيل الدخول مرة أخرى.';

  @override
  String get workspaceAccessDenied =>
      'ليست لديك صلاحية للوصول إلى مساحة العمل على الجوال.';

  @override
  String get mobileResourceNotFound =>
      'لم يتم العثور على المورد المطلوب على الجوال.';

  @override
  String get requestFailed => 'فشل الطلب';

  @override
  String get projects => 'المشاريع';

  @override
  String get searchProjects => 'البحث عن المشاريع';

  @override
  String get projectDetails => 'تفاصيل المشروع';

  @override
  String get requestDetails => 'تفاصيل الطلب';

  @override
  String get leads => 'العملاء المحتملون';

  @override
  String get conversations => 'المحادثات';

  @override
  String get dealRooms => 'غرف الصفقات';

  @override
  String get reservations => 'الحجوزات';

  @override
  String get attendance => 'الحضور';

  @override
  String get profile => 'الملف الشخصي';

  @override
  String get settings => 'الإعدادات';

  @override
  String get logout => 'تسجيل الخروج';

  @override
  String get loading => 'جار التحميل';

  @override
  String get noResultsYet => 'لا توجد نتائج بعد';

  @override
  String get tryAgain => 'حاول مرة أخرى';

  @override
  String get retry => 'إعادة المحاولة';

  @override
  String get sendMessage => 'إرسال رسالة';

  @override
  String get send => 'إرسال';

  @override
  String get sending => 'جار الإرسال';

  @override
  String get dismiss => 'إغلاق';

  @override
  String get marketplace => 'السوق';

  @override
  String get units => 'الوحدات';

  @override
  String get map => 'الخريطة';

  @override
  String get refreshProjects => 'تحديث المشاريع';

  @override
  String get refreshUnits => 'تحديث الوحدات';

  @override
  String get refreshMapSearch => 'تحديث بحث الخريطة';

  @override
  String get refreshRequests => 'تحديث الطلبات';

  @override
  String get refreshDealRooms => 'تحديث غرف الصفقات';

  @override
  String get refreshDeals => 'تحديث الصفقات';

  @override
  String get refreshCommissions => 'تحديث العمولات';

  @override
  String get refreshAttendance => 'تحديث الحضور';

  @override
  String get refreshConversations => 'تحديث المحادثات';

  @override
  String get refreshLead => 'تحديث العميل المحتمل';

  @override
  String get refreshCrmLeads => 'تحديث عملاء CRM المحتملين';

  @override
  String get refreshMarketplaceCrmLeads => 'تحديث عملاء CRM في السوق';

  @override
  String get refreshCrmSummary => 'تحديث ملخص CRM';

  @override
  String get filters => 'الفلاتر';

  @override
  String get closeFilters => 'إغلاق الفلاتر';

  @override
  String get marketplaceFilters => 'فلاتر السوق';

  @override
  String get city => 'المدينة';

  @override
  String get district => 'الحي';

  @override
  String get unitType => 'نوع الوحدة';

  @override
  String get minPrice => 'أقل سعر';

  @override
  String get maxPrice => 'أعلى سعر';

  @override
  String get bedrooms => 'غرف النوم';

  @override
  String get bathrooms => 'الحمامات';

  @override
  String get minArea => 'أقل مساحة';

  @override
  String get maxArea => 'أكبر مساحة';

  @override
  String get clear => 'مسح';

  @override
  String get apply => 'تطبيق';

  @override
  String get noVisibleProjects => 'لا توجد مشاريع ظاهرة';

  @override
  String get projectsAppearHere =>
      'تظهر المشاريع هنا عندما تتيحها واجهة API لك.';

  @override
  String get projectsUnavailable => 'المشاريع غير متاحة';

  @override
  String get noVisibleUnits => 'لا توجد وحدات ظاهرة';

  @override
  String get availableInventoryAppearsHere =>
      'تظهر الوحدات المتاحة هنا بعد فحوصات الظهور في API.';

  @override
  String get unitsUnavailable => 'الوحدات غير متاحة';

  @override
  String get project => 'المشروع';

  @override
  String get unit => 'الوحدة';

  @override
  String get images => 'الصور';

  @override
  String get paymentPlans => 'خطط الدفع';

  @override
  String get paymentDetails => 'تفاصيل الدفع';

  @override
  String get availableUnits => 'الوحدات المتاحة';

  @override
  String get createLeadClaim => 'إنشاء مطالبة عميل';

  @override
  String get noUnitsVisible => 'لا توجد وحدات ظاهرة';

  @override
  String get backendDidNotExposeUnits =>
      'لم تعرض الواجهة الخلفية وحدات لهذا المشروع.';

  @override
  String get projectUnavailable => 'المشروع غير متاح';

  @override
  String get unitUnavailable => 'الوحدة غير متاحة';

  @override
  String developerLabel(Object name) {
    return 'المطور: $name';
  }

  @override
  String get status => 'الحالة';

  @override
  String get visibility => 'الظهور';

  @override
  String get type => 'النوع';

  @override
  String get area => 'المساحة';

  @override
  String get floor => 'الدور';

  @override
  String get projectPending => 'المشروع قيد الانتظار';

  @override
  String get locationPending => 'الموقع قيد الانتظار';

  @override
  String get priceOnRequest => 'السعر عند الطلب';

  @override
  String get amountPending => 'المبلغ قيد الانتظار';

  @override
  String fromPrice(Object price) {
    return 'ابتداء من $price';
  }

  @override
  String unitsCount(Object count) {
    return '$count وحدات';
  }

  @override
  String bedCount(Object count) {
    return '$count غرفة';
  }

  @override
  String sqmValue(Object value) {
    return '$value م²';
  }

  @override
  String get noPaymentPlans => 'لم يتم إرجاع أي خطط دفع بعد.';

  @override
  String downPaymentPercent(Object value) {
    return '$value% دفعة مقدمة';
  }

  @override
  String installmentsCount(Object count) {
    return '$count قسط';
  }

  @override
  String yearsCount(Object count) {
    return '$count سنة';
  }

  @override
  String get mapSearch => 'بحث الخريطة';

  @override
  String get mapPlaceholder =>
      'واجهة الخريطة مؤقتة وتستخدم بحث bbox من الواجهة الخلفية.';

  @override
  String get noMapResults => 'لا توجد نتائج على الخريطة';

  @override
  String get mapResultsAppearHere =>
      'تظهر المشاريع المرئية داخل نطاق bbox هنا.';

  @override
  String get mapSearchUnavailable => 'بحث الخريطة غير متاح';

  @override
  String get crmLeads => 'عملاء CRM المحتملون';

  @override
  String get marketplaceCrmLeads => 'عملاء CRM في السوق';

  @override
  String get crmConversations => 'محادثات CRM';

  @override
  String get crmLead => 'عميل CRM محتمل';

  @override
  String get noCrmLeads => 'لا يوجد عملاء CRM محتملون';

  @override
  String get crmLeadsAppearHere =>
      'تظهر هنا عملاء CRM العامة والمطالب بها ضمن نطاقك.';

  @override
  String get crmLeadsUnavailable => 'عملاء CRM المحتملون غير متاحين';

  @override
  String get noMarketplaceCrmLeads => 'لا يوجد عملاء CRM من السوق';

  @override
  String get marketplaceCrmLeadsAppearHere =>
      'تظهر هنا عملاء CRM القابلة للمطالبة عند توفرها.';

  @override
  String get marketplaceCrmLeadsUnavailable => 'عملاء CRM في السوق غير متاحين';

  @override
  String get maskedLead => 'عميل مخفي';

  @override
  String phoneEnding(Object digits) {
    return 'الهاتف ينتهي بـ $digits';
  }

  @override
  String get noProjectAttached => 'لا يوجد مشروع مرتبط';

  @override
  String createdAt(Object date) {
    return 'تم الإنشاء $date';
  }

  @override
  String updatedAt(Object date) {
    return 'تم التحديث $date';
  }

  @override
  String expiresAt(Object date) {
    return 'ينتهي $date';
  }

  @override
  String get expires => 'ينتهي';

  @override
  String soldAt(Object date) {
    return 'تم البيع $date';
  }

  @override
  String get sold => 'تم البيع';

  @override
  String openedAt(Object date) {
    return 'فتح $date';
  }

  @override
  String get claimed => 'تمت المطالبة';

  @override
  String get unclaimed => 'غير مطالب به';

  @override
  String get unavailable => 'غير متاح';

  @override
  String get all => 'الكل';

  @override
  String get newStatus => 'جديد';

  @override
  String get inChat => 'في المحادثة';

  @override
  String get qualified => 'مؤهل';

  @override
  String get lost => 'مفقود';

  @override
  String get converted => 'تم التحويل';

  @override
  String get spam => 'مزعج';

  @override
  String get contact => 'التواصل';

  @override
  String get call => 'اتصال';

  @override
  String get chat => 'دردشة';

  @override
  String get whatsApp => 'واتساب';

  @override
  String get actions => 'الإجراءات';

  @override
  String get openConversation => 'فتح المحادثة';

  @override
  String get claimLead => 'المطالبة بالعميل';

  @override
  String get claim => 'مطالبة';

  @override
  String get updateStatus => 'تحديث الحالة';

  @override
  String get attendanceToday => 'اليوم';

  @override
  String get attendanceHistory => 'سجل الحضور الأخير';

  @override
  String get attendanceUnavailable => 'الحضور غير متاح';

  @override
  String get attendanceDate => 'التاريخ';

  @override
  String get attendanceDuration => 'المدة';

  @override
  String get checkIn => 'تسجيل الدخول';

  @override
  String get checkOut => 'تسجيل الخروج';

  @override
  String get checkInTime => 'وقت الدخول';

  @override
  String get checkOutTime => 'وقت الخروج';

  @override
  String get attendanceCompletedToday => 'تم إكمال حضور اليوم';

  @override
  String get attendanceNote => 'ملاحظة';

  @override
  String durationMinutes(Object count) {
    return '$count دقيقة';
  }

  @override
  String get noAttendanceHistory => 'لا يوجد سجل حضور';

  @override
  String get attendanceHistoryAppearsHere =>
      'تظهر هنا سجلات تسجيل الدخول والخروج الأخيرة الخاصة بك.';

  @override
  String get noEmployeeProfileLinked => 'لا يوجد ملف موظف مرتبط بهذا الحساب.';

  @override
  String get companyAwaitingVerification =>
      'المؤسسة في انتظار مراجعة وتفعيل المنصة.';

  @override
  String get alreadyCheckedIn => 'لقد سجّلت الدخول بالفعل.';

  @override
  String get checkInBeforeCheckOut => 'يجب تسجيل الدخول قبل تسجيل الخروج.';

  @override
  String get attendanceVerificationStatus => 'التحقق';

  @override
  String get attendanceDvrStatus => 'مراجعة DVR';

  @override
  String get attendanceFailureReasons => 'أسباب الرفض';

  @override
  String get attendanceSecureChecks => 'فحوصات الأمان';

  @override
  String get attendanceNativeChecksUnavailable =>
      'تحتاج فحوصات الموقع وشبكة Wi-Fi والكاميرا وسلامة الجهاز إلى نسخة الجوال الآمنة. ستفرض واجهة API سياسة الشركة عند إرسال الأدلة.';

  @override
  String get attendanceNativeChecksActive =>
      'تجمع هذه النسخة الآمنة موقع GPS وتفاصيل شبكة Wi-Fi عندما يسمح النظام بذلك وإشارات سلامة الجهاز وصورة مباشرة من الكاميرا قبل إرسال الحضور إلى واجهة API.';

  @override
  String get collectingAttendanceEvidence => 'جارٍ جمع أدلة الحضور الآمنة';

  @override
  String get attendanceEvidenceWarnings => 'تنبيهات الأدلة';

  @override
  String get attendanceLocationPermissionDenied => 'تم رفض إذن الموقع.';

  @override
  String get attendanceLocationServiceDisabled => 'خدمات الموقع غير مفعّلة.';

  @override
  String get attendanceWifiUnavailable => 'الهاتف غير متصل بشبكة Wi-Fi.';

  @override
  String get attendanceWifiRestricted =>
      'اسم شبكة Wi-Fi أو عنوان BSSID غير متاح على هذا الجهاز أو النظام.';

  @override
  String get attendanceCameraPermissionDenied => 'تم رفض إذن الكاميرا.';

  @override
  String get attendancePhotoCaptureCancelled =>
      'تم إلغاء التقاط الصورة المباشرة.';

  @override
  String get attendancePhotoUploadFailed =>
      'فشل رفع الصورة المباشرة. يرجى المحاولة مرة أخرى.';

  @override
  String get attendanceCapturingPhoto => 'جارٍ التقاط الصورة المباشرة';

  @override
  String get attendancePhotoCaptured => 'تم التقاط الصورة';

  @override
  String get attendanceUploadingPhoto => 'جارٍ رفع صورة الحضور';

  @override
  String get attendancePhotoUploadSuccess => 'تم رفع صورة الحضور';

  @override
  String get attendancePhotoTooLarge => 'صورة الحضور كبيرة جداً.';

  @override
  String get attendanceInvalidPhotoType =>
      'يجب أن تكون صورة الحضور بصيغة JPEG أو PNG أو WebP.';

  @override
  String get attendancePhotoRejected => 'رفض الخادم صورة الحضور.';

  @override
  String get attendanceRetryUpload => 'إعادة محاولة الرفع';

  @override
  String get attendanceDvrPending => 'مراجعة DVR قيد الانتظار.';

  @override
  String get attendanceManualReviewRequired => 'المراجعة اليدوية مطلوبة.';

  @override
  String get attendanceVerificationFailed => 'فشل التحقق من الحضور.';

  @override
  String get developerOptionsEnabled => 'خيارات المطوّر مفعّلة.';

  @override
  String get usbDebuggingEnabled => 'تصحيح USB مفعّل.';

  @override
  String get attendanceLocationRequired => 'الموقع مطلوب.';

  @override
  String get attendanceLocationPolicyMissing => 'موقع حضور الشركة غير مضبوط.';

  @override
  String get outsideAllowedLocation => 'أنت خارج نطاق موقع الشركة المسموح.';

  @override
  String get attendanceWifiRequired => 'شبكة Wi-Fi الخاصة بالشركة مطلوبة.';

  @override
  String get notConnectedToCompanyWifi =>
      'أنت غير متصل بشبكة Wi-Fi الخاصة بالشركة.';

  @override
  String get attendancePhotoRequired => 'صورة مباشرة داخل المكتب مطلوبة.';

  @override
  String get updateLeadStatus => 'تحديث حالة العميل';

  @override
  String get saveStatus => 'حفظ الحالة';

  @override
  String get statusNoteOptional => 'ملاحظة الحالة اختيارية';

  @override
  String get leadClaimed => 'تمت المطالبة بالعميل.';

  @override
  String get leadAlreadyClaimed => 'تمت المطالبة بهذا العميل بالفعل.';

  @override
  String get leadStatusUpdated => 'تم تحديث حالة العميل.';

  @override
  String get projectLabel => 'المشروع';

  @override
  String get sourcePage => 'صفحة المصدر';

  @override
  String get created => 'تاريخ الإنشاء';

  @override
  String get claimedLabel => 'تاريخ المطالبة';

  @override
  String get claimOrganization => 'جهة المطالبة';

  @override
  String get statusNote => 'ملاحظة الحالة';

  @override
  String get utm => 'UTM';

  @override
  String get crmSummary => 'ملخص CRM';

  @override
  String crmSummaryUnavailable(Object message) {
    return 'ملخص CRM غير متاح: $message';
  }

  @override
  String get totalLeads => 'إجمالي العملاء';

  @override
  String get newLeads => 'جدد';

  @override
  String get qualifiedLeads => 'مؤهلون';

  @override
  String get openChats => 'محادثات مفتوحة';

  @override
  String get todayLeads => 'عملاء اليوم';

  @override
  String get todayMessages => 'رسائل اليوم';

  @override
  String get conversation => 'المحادثة';

  @override
  String get publicConversation => 'محادثة عامة';

  @override
  String get noConversations => 'لا توجد محادثات';

  @override
  String get conversationsAppearHere => 'تظهر محادثات CRM ضمن نطاقك هنا.';

  @override
  String get conversationUnavailable => 'المحادثة غير متاحة';

  @override
  String get conversationsUnavailable => 'المحادثات غير متاحة';

  @override
  String get crmConversation => 'محادثة CRM';

  @override
  String get shareLink => 'رابط مشاركة';

  @override
  String get publicShareToken => 'رمز مشاركة عام';

  @override
  String get noMessagesYet => 'لا توجد رسائل بعد';

  @override
  String get messagesAppearHere => 'تظهر رسائل هذه المحادثة هنا.';

  @override
  String get messagesUnavailable => 'الرسائل غير متاحة';

  @override
  String get writeMessage => 'اكتب رسالة';

  @override
  String get updateConversationStatus => 'تحديث حالة المحادثة';

  @override
  String get conversationStatusUpdated => 'تم تحديث حالة المحادثة.';

  @override
  String get open => 'مفتوحة';

  @override
  String get closed => 'مغلقة';

  @override
  String get archived => 'مؤرشفة';

  @override
  String get thisSharedConversation =>
      'تعرض هذه المحادثة المشتركة حقول دردشة آمنة للعامة فقط.';

  @override
  String get publicSafeMessagesAppearHere =>
      'تظهر الرسائل الآمنة للعامة لهذه المحادثة هنا.';

  @override
  String get conversationClosed => 'هذه المحادثة مغلقة.';

  @override
  String get reply => 'الرد';

  @override
  String get yourNameOptional => 'اسمك اختياري';

  @override
  String get message => 'الرسالة';

  @override
  String get writePlainTextReply => 'اكتب ردا نصيا فقط';

  @override
  String get sendReply => 'إرسال الرد';

  @override
  String get messageSent => 'تم إرسال الرسالة.';

  @override
  String get enterMessageBeforeSending => 'يرجى إدخال رسالة قبل الإرسال.';

  @override
  String get messageTooLong =>
      'الرسالة طويلة جدا. يرجى أن تكون أقل من 2000 حرف.';

  @override
  String get conversationLinkUnavailable => 'رابط هذه المحادثة لم يعد متاحا.';

  @override
  String get tooManyMessages => 'عدد الرسائل كبير. يرجى المحاولة بعد قليل.';

  @override
  String get checkMessageTryAgain => 'يرجى مراجعة الرسالة والمحاولة مرة أخرى.';

  @override
  String get couldNotSendMessage => 'تعذر إرسال رسالتك. حاول مرة أخرى.';

  @override
  String get signedIn => 'تم تسجيل الدخول';

  @override
  String get role => 'الدور';

  @override
  String get organization => 'المؤسسة';

  @override
  String get brokerProfile => 'ملف الوسيط';

  @override
  String get myLeadClaims => 'مطالباتي بالعملاء';

  @override
  String get reservationRequests => 'طلبات الحجز';

  @override
  String get myDeals => 'صفقاتي';

  @override
  String get myCommissions => 'عمولاتي';

  @override
  String get editPlaceholder => 'تحرير مؤقت';

  @override
  String get editBrokerProfile => 'تعديل ملف الوسيط';

  @override
  String get brokerProfileUnavailable => 'ملف الوسيط غير متاح';

  @override
  String get brokerProfileBackendReady =>
      'هذه الشاشة جاهزة لـ GET /broker-profile/me عند إتاحتها من الواجهة الخلفية.';

  @override
  String get editProfileInactive => 'تعديل الملف غير مفعل بعد';

  @override
  String get profileUpdateApisUnavailable =>
      'واجهات تحديث الملف ليست ضمن شريحة الواجهة الخلفية الحالية.';

  @override
  String get license => 'الرخصة';

  @override
  String get phone => 'الهاتف';

  @override
  String get country => 'الدولة';

  @override
  String get experience => 'الخبرة';

  @override
  String yearsExperience(Object count) {
    return '$count سنة';
  }

  @override
  String get noReservationRequests => 'لا توجد طلبات حجز';

  @override
  String get createRequestFromLeadClaim => 'أنشئ طلبا من مطالبة عميل نشطة.';

  @override
  String get requestsUnavailable => 'الطلبات غير متاحة';

  @override
  String get reservationRequest => 'طلب حجز';

  @override
  String get reservationRequestCancelled => 'تم إلغاء طلب الحجز.';

  @override
  String get dealRoomCreated => 'تم إنشاء غرفة الصفقة.';

  @override
  String get createDealRoom => 'إنشاء غرفة صفقة';

  @override
  String get cancelRequest => 'إلغاء الطلب';

  @override
  String get requestUnavailable => 'الطلب غير متاح';

  @override
  String get approved => 'تمت الموافقة';

  @override
  String get rejected => 'مرفوض';

  @override
  String get cancelled => 'ملغى';

  @override
  String get reason => 'السبب';

  @override
  String get notes => 'ملاحظات';

  @override
  String unitLabel(Object value) {
    return 'الوحدة: $value';
  }

  @override
  String get submitReservationRequest => 'إرسال طلب الحجز';

  @override
  String reservationRequestStatus(Object status) {
    return 'طلب الحجز $status.';
  }

  @override
  String get noDealRooms => 'لا توجد غرف صفقات';

  @override
  String get dealRoomsAppearHere => 'تظهر غرف الصفقات هنا بعد فتح حجز معتمد.';

  @override
  String get dealRoomsUnavailable => 'غرف الصفقات غير متاحة';

  @override
  String get dealRoomNotFound => 'لم يتم العثور على غرفة الصفقة';

  @override
  String get dealRoomAccessDenied =>
      'ليس لديك صلاحية الوصول إلى غرفة الصفقة هذه';

  @override
  String get couldNotLoadDealRoomTryAgain =>
      'تعذر تحميل غرفة الصفقة. حاول مرة أخرى.';

  @override
  String get dealRoom => 'غرفة الصفقة';

  @override
  String get dealRoomActions => 'إجراءات غرفة الصفقة';

  @override
  String get moveToNegotiation => 'نقل إلى التفاوض';

  @override
  String get moveToPendingApproval => 'نقل إلى انتظار الموافقة';

  @override
  String get inviteClient => 'دعوة العميل';

  @override
  String get clientInviteCreated => 'تم إنشاء دعوة العميل.';

  @override
  String dealRoomMovedTo(Object status) {
    return 'تم نقل غرفة الصفقة إلى $status.';
  }

  @override
  String get participants => 'المشاركون';

  @override
  String get noParticipantsYet => 'لم يتم إرجاع أي مشاركين بعد.';

  @override
  String get clientInvite => 'دعوة العميل';

  @override
  String get notInvited => 'لم تتم الدعوة';

  @override
  String get messages => 'الرسائل';

  @override
  String get messagesAndStatusAppearHere => 'تظهر الرسائل وتحديثات الحالة هنا.';

  @override
  String participantsCount(Object count) {
    return '$count مشاركين';
  }

  @override
  String messagesCount(Object count) {
    return '$count رسائل';
  }

  @override
  String messagesOpenedSummary(Object count, Object date) {
    return '$count رسائل · فتح $date';
  }

  @override
  String reservationStatus(Object status) {
    return 'الحجز $status';
  }

  @override
  String get leadClaim => 'مطالبة عميل';

  @override
  String get noLeadClaims => 'لا توجد مطالبات عملاء';

  @override
  String get createClaimFromProjectOrUnit =>
      'أنشئ مطالبة من شاشة تفاصيل مشروع أو وحدة.';

  @override
  String get claimsUnavailable => 'المطالبات غير متاحة';

  @override
  String get claimUnavailable => 'المطالبة غير متاحة';

  @override
  String get leadClaimReleased => 'تم تحرير مطالبة العميل.';

  @override
  String get createReservationRequest => 'إنشاء طلب حجز';

  @override
  String get releaseClaim => 'تحرير المطالبة';

  @override
  String get client => 'العميل';

  @override
  String get noUnitSelected => 'لم يتم اختيار وحدة';

  @override
  String get released => 'تم التحرير';

  @override
  String get clientName => 'اسم العميل';

  @override
  String get clientNameRequired => 'اسم العميل مطلوب';

  @override
  String get clientPhone => 'هاتف العميل';

  @override
  String get clientPhoneRequired => 'هاتف العميل مطلوب';

  @override
  String get sourceManual => 'المصدر: MANUAL';

  @override
  String get leadClaimCreated => 'تم إنشاء مطالبة العميل.';

  @override
  String get clientAlreadyRegistered => 'هذا العميل مسجل بالفعل لهذا المشروع.';

  @override
  String get deal => 'الصفقة';

  @override
  String get noDealsYet => 'لا توجد صفقات بعد';

  @override
  String get dealsAppearHere => 'تظهر هنا الصفقات المباعة والمعتمدة ضمن نطاقك.';

  @override
  String get dealsUnavailable => 'الصفقات غير متاحة';

  @override
  String get dealUnavailable => 'الصفقة غير متاحة';

  @override
  String get dealRoomLabel => 'غرفة الصفقة';

  @override
  String get broker => 'الوسيط';

  @override
  String get brokerage => 'شركة الوساطة';

  @override
  String get openDealRoom => 'فتح غرفة الصفقة';

  @override
  String roomShortId(Object id) {
    return 'الغرفة $id';
  }

  @override
  String get commission => 'العمولة';

  @override
  String get noCommissionsYet => 'لا توجد عمولات بعد';

  @override
  String get commissionsAppearHere => 'تظهر هنا سجلات العمولات ضمن نطاقك.';

  @override
  String get commissionsUnavailable => 'العمولات غير متاحة';

  @override
  String get commissionUnavailable => 'العمولة غير متاحة';

  @override
  String get openDeal => 'فتح الصفقة';

  @override
  String get routeNotFound => 'المسار غير موجود';

  @override
  String get openProjectOrUnitFirst =>
      'افتح مشروعا أو وحدة أولا، ثم أنشئ المطالبة.';

  @override
  String get openActiveLeadClaimFirst =>
      'افتح مطالبة عميل نشطة أولا، ثم أنشئ الطلب.';

  @override
  String get continueAsGuest => 'المتابعة كضيف';

  @override
  String get continueBrowsing => 'متابعة التصفح';

  @override
  String get guestMarketplaceTitle => 'تصفح كضيف';

  @override
  String get guestMarketplaceMessage =>
      'استكشف المشاريع العامة دون تسجيل الدخول. سجّل الدخول عندما تحتاج إلى أدوات مساحة العمل أو الإجراءات المحمية.';

  @override
  String get signInToRequest => 'سجّل الدخول لإرسال الطلب';
}
