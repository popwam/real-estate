import { Injectable } from '@nestjs/common';
import { ProjectVisibility, UnitVisibility } from '@prisma/client';

@Injectable()
export class VisibilityRulesService {
  projectVisibilities() {
    return Object.values(ProjectVisibility);
  }

  unitVisibilities() {
    return Object.values(UnitVisibility);
  }
}
