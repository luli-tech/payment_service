import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { TransactionsModule } from '../transactions/transactions.module';
import { PaystackModule } from '../paystack/paystack.module';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { UnifiedAuthGuard } from '../auth/unified-auth.guard';

@Module({
  imports: [TransactionsModule, PaystackModule],
  controllers: [WalletController],
  providers: [
    WalletService,
    PrismaService,
    JwtAuthGuard,
    ApiKeyGuard,
    UnifiedAuthGuard,
  ],
})
export class WalletModule {}
