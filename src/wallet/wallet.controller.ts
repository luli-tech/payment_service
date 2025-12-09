import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { PaystackService } from '../paystack/paystack.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { TransferDto } from './dto/transfer-wallet.dto';
import { CreatePaystackDto } from '../paystack/dto/create-paystack.dto';
import { UnifiedAuthGuard } from '../auth/unified-auth.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { ApiKeyPermission } from '../common/enums/api-key-permission.enum';

@Controller('wallet')
@UseGuards(UnifiedAuthGuard)
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly paystackService: PaystackService,
  ) {}

  // Deposit initialization via Paystack
  @Post('deposit')
  @RequirePermissions(ApiKeyPermission.DEPOSIT)
  async deposit(@Req() req, @Body() dto: CreatePaystackDto) {
    const userId = req.user?.sub || req.apiKey?.userId;
    // Ensure DTO contains userId for reference
    const payload = { ...dto, userId };
    return this.paystackService.initialize(payload);
  }

  @Get('balance')
  @RequirePermissions(ApiKeyPermission.READ)
  getBalance(@Req() req) {
    const userId = req.user?.sub || req.apiKey?.userId;
    return this.walletService.getBalance(userId);
  }

  @Get('transactions')
  @RequirePermissions(ApiKeyPermission.READ)
  getTransactions(@Req() req) {
    const userId = req.user?.sub || req.apiKey?.userId;
    return this.walletService.getTransactions(userId);
  }

  // Transfer funds to another wallet
  @Post('transfer')
  @RequirePermissions(ApiKeyPermission.TRANSFER)
  transfer(@Req() req, @Body() transferDto: TransferDto) {
    const senderUserId = req.user?.sub || req.apiKey?.userId;
    const { recipientWalletId, amount } = transferDto;
    return this.walletService.transfer(senderUserId, recipientWalletId, amount);
  }

  @Post()
  create(@Req() req, @Body() createWalletDto: CreateWalletDto) {
      const userId = req.user?.sub || req.apiKey?.userId;
      // DTO might not have userId if it's coming from body, but service expects it.
      // We pass it explicitly or merge it.
      return this.walletService.create({ ...createWalletDto, userId });
  }

  @Get()
  @RequirePermissions(ApiKeyPermission.READ)
  findAll() {
    return this.walletService.findAll();
  }

  @Get(':id')
  @RequirePermissions(ApiKeyPermission.READ)
  findOne(@Param('id') id: string) {
    return this.walletService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWalletDto: UpdateWalletDto) {
    return this.walletService.update(+id, updateWalletDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.walletService.remove(+id);
  }
}
