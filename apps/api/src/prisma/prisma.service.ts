import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@tennisillo/db';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  async onModuleDestroy(): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await this.$disconnect();
  }
}
