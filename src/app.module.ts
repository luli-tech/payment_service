import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { WalletModule } from './wallet/wallet.module';
import { TransactionsModule } from './transactions/transactions.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { PaystackModule } from './paystack/paystack.module';
import { BackgroundWorkerModule } from './background_worker/background_worker.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    WalletModule,
    TransactionsModule,
    ApiKeysModule,
    PaystackModule,
    BackgroundWorkerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
