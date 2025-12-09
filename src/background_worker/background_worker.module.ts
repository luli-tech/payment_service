import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BackgroundWorkerProcessor } from './processor';
import { BackgroundWorkerService } from './background_worker.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: parseInt(process.env.REDIS_PORT) || 6379,
      },
    }),

    BullModule.registerQueue({
      name: 'transactions',
    }),
  ],
  providers: [BackgroundWorkerProcessor, BackgroundWorkerService, PrismaService],
  exports: [BackgroundWorkerService],
})
export class BackgroundWorkerModule {}
