import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class BackgroundWorkerService {
  constructor(@InjectQueue('transactions') private txQueue: Queue) {}

  async addWebhookJob(data: any) {
    await this.txQueue.add('handle_webhook', data);
  }
}
