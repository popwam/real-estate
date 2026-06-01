import { MarketplaceProjectFiltersDto } from './marketplace-project-filters.dto';

export class MarketplaceMapSearchDto {
  bbox!: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
  filters?: MarketplaceProjectFiltersDto;
}
