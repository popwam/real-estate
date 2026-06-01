export class CreateProjectDto {
  name!: string;
  slug?: string;
  type!: string;
  status?: string;
  city?: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  deliveryDate?: string;
  description?: string;
  coverImageUrl?: string;
  images?: string[];
  videos?: string[];
  brochureUrl?: string;
  amenities?: string[];
  visibility?: string;
  isFeatured?: boolean;
}
