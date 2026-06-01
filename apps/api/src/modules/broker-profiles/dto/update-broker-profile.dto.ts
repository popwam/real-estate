export class UpdateBrokerProfileDto {
  isIndividual?: boolean;
  nationalId?: string;
  nationalIdUrl?: string;
  yearsExperience?: number;
  specializations?: string[];
  restrictionLevel?: string;
}
