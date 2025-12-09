import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('transactions')
export class BackgroundWorkerProcessor extends WorkerHost {
  async process(job: Job<any>): Promise<any> {
    console.log('Processing Job:', job.name, job.data);
  }
}
