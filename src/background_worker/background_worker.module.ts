import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BackgroundWorkerProcessor } from './processor';
import { BackgroundWorkerService } from './background_worker.service';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: '127.0.0.1',
        port: 6379,
      },
    }),

    BullModule.registerQueue({
      name: 'transactions',
    }),
  ],
  providers: [BackgroundWorkerProcessor, BackgroundWorkerService],
  exports: [BackgroundWorkerService],
})
export class BackgroundWorkerModule {}
