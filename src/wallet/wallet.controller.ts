import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { PaystackService } from '../paystack/paystack.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { TransferDto } from './dto/transfer-wallet.dto';
import { CreatePaystackDto } from '../paystack/dto/create-paystack.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiKeyGuard } from '../auth/api-key.guard';

@Controller('wallet')
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly paystackService: PaystackService,
  ) {}

  // Deposit initialization via Paystack
  @Post('deposit')
  @UseGuards(JwtAuthGuard, ApiKeyGuard)
  async deposit(@Req() req, @Body() dto: CreatePaystackDto) {
    const userId = req.user?.sub || req.apiKey?.userId;
    // Ensure DTO contains userId for reference
    const payload = { ...dto, userId };
    return this.paystackService.initialize(payload);
  }

  @Get('balance')
  @UseGuards(JwtAuthGuard, ApiKeyGuard)
  getBalance(@Req() req) {
    const userId = req.user?.sub || req.apiKey?.userId;
    return this.walletService.getBalance(userId);
  }

  @Get('transactions')
  @UseGuards(JwtAuthGuard, ApiKeyGuard)
  getTransactions(@Req() req) {
    const userId = req.user?.sub || req.apiKey?.userId;
    return this.walletService.getTransactions(userId);
  }

  // Transfer funds to another wallet
  @Post('transfer')
  @UseGuards(JwtAuthGuard, ApiKeyGuard)
  transfer(@Req() req, @Body() transferDto: TransferDto) {
    const senderUserId = req.user?.sub || req.apiKey?.userId;
    const { recipientWalletId, amount } = transferDto;
    return this.walletService.transfer(senderUserId, recipientWalletId, amount);
  }

  @Post()
  @UseGuards(JwtAuthGuard, ApiKeyGuard)
  create(@Body() createWalletDto: CreateWalletDto) {
    return this.walletService.create(createWalletDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, ApiKeyGuard)
  findAll() {
    return this.walletService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, ApiKeyGuard)
  findOne(@Param('id') id: string) {
    return this.walletService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, ApiKeyGuard)
  update(@Param('id') id: string, @Body() updateWalletDto: UpdateWalletDto) {
    return this.walletService.update(+id, updateWalletDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, ApiKeyGuard)
  remove(@Param('id') id: string) {
    return this.walletService.remove(+id);
  }
}
