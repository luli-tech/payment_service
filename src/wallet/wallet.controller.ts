import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Query } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { TransferDto } from './dto/transfer-wallet.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // assume guard exists
import { ApiKeyGuard } from '../auth/api-key.guard'; // assume guard exists

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

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

  // New endpoint: get wallet balance for authenticated user
  @Get('balance')
  @UseGuards(JwtAuthGuard, ApiKeyGuard)
  getBalance(@Req() req) {
    // Assuming JWT payload contains sub as userId
    const userId = req.user?.sub || req.apiKey?.userId;
    return this.walletService.getBalance(userId);
  }

  // New endpoint: transfer funds to another wallet
  @Post('transfer')
  @UseGuards(JwtAuthGuard, ApiKeyGuard)
  transfer(@Req() req, @Body() transferDto: TransferDto) {
    const senderUserId = req.user?.sub || req.apiKey?.userId;
    const { recipientWalletId, amount } = transferDto;
    return this.walletService.transfer(senderUserId, recipientWalletId, amount);
  }

  // New endpoint: transaction history for user
  @Get('transactions')
  @UseGuards(JwtAuthGuard, ApiKeyGuard)
  getTransactions(@Req() req) {
    const userId = req.user?.sub || req.apiKey?.userId;
    // Assuming TransactionsService has method findByUser
    return this.walletService['transactionsService'].findByUser(userId);
  }
}
