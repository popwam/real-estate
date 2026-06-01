export class UpdateOrganizationWebsiteSettingsDto {
  publicSlug?: string;
  subdomain?: string;
  customDomain?: string | null;
  siteTitle?: string;
  siteDescription?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  whatsappUrl?: string | null;
  isPublished?: boolean;
}
