import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.lead.findUnique({ where: { id } });
  }
}
