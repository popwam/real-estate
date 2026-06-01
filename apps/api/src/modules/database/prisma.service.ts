import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { EnvService } from '../../config/env.service';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor(env: EnvService) {
    const adapter = new PrismaPg({ connectionString: env.databaseUrl });

    super({ adapter });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
