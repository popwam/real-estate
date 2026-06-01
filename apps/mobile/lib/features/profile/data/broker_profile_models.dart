import '../../../shared/models/json_helpers.dart';

class BrokerProfile {
  const BrokerProfile({
    required this.id,
    this.licenseNumber,
    this.displayName,
    this.phone,
    this.country,
    this.city,
    this.status,
    this.yearsOfExperience,
  });

  final String id;
  final String? licenseNumber;
  final String? displayName;
  final String? phone;
  final String? country;
  final String? city;
  final String? status;
  final int? yearsOfExperience;

  factory BrokerProfile.fromJson(Map<String, dynamic> json) {
    return BrokerProfile(
      id: stringValue(json, 'id'),
      licenseNumber: json['licenseNumber']?.toString(),
      displayName: json['displayName']?.toString() ?? json['name']?.toString(),
      phone: json['phone']?.toString(),
      country: json['country']?.toString(),
      city: json['city']?.toString(),
      status: json['status']?.toString(),
      yearsOfExperience: intValue(json, 'yearsOfExperience'),
    );
  }
}
