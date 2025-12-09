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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader, ApiBody } from '@nestjs/swagger';

@ApiTags('Wallet')
@ApiBearerAuth()
@ApiHeader({ name: 'x-api-key', description: 'API Key for service access (Alternative to Bearer Token)', required: false })
@Controller('wallet')
@UseGuards(UnifiedAuthGuard)
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly paystackService: PaystackService,
  ) {}

  @Post('deposit')
  @RequirePermissions(ApiKeyPermission.DEPOSIT)
  @ApiOperation({ 
    summary: 'Initialize a Paystack deposit', 
    description: 'Generates a Paystack payment link for the user to deposit funds. Requires DEPOSIT permission.' 
  })
  @ApiResponse({ status: 201, description: 'Deposit initialized successfully. Returns authorization URL.', type: Object })
  @ApiResponse({ status: 400, description: 'Bad Request. Invalid input data.' })
  @ApiResponse({ status: 401, description: 'Unauthorized. Missing or invalid Authentication.' })
  @ApiResponse({ status: 403, description: 'Forbidden. API Key missing DEPOSIT permission.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error. Paystack initialization failed.' })
  async deposit(@Req() req, @Body() dto: CreatePaystackDto) {
    const userId = (req.user?.sub || req.apiKey?.userId) as string;
    const payload = { ...dto, userId };
    return this.paystackService.initialize(payload);
  }

  @Get('balance')
  @RequirePermissions(ApiKeyPermission.READ)
  @ApiOperation({ 
    summary: 'Get wallet balance', 
    description: 'Retrieves the current balance of the authenticated user\'s wallet. Requires READ permission.' 
  })
  @ApiResponse({ status: 200, description: 'Current balance returned successfully.', schema: { example: { balance: 15000 } } })
  @ApiResponse({ status: 401, description: 'Unauthorized. Missing or invalid Authentication.' })
  @ApiResponse({ status: 403, description: 'Forbidden. API Key missing READ permission.' })
  @ApiResponse({ status: 404, description: 'Wallet not found for user.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error.' })
  getBalance(@Req() req) {
    const userId = (req.user?.sub || req.apiKey?.userId) as string;
    return this.walletService.getBalance(userId);
  }

  @Get('transactions')
  @RequirePermissions(ApiKeyPermission.READ)
  @ApiOperation({ 
    summary: 'Get transaction history', 
    description: 'Retrieves the list of all transactions (deposits/transfers) for the user. Ordered by date. Requires READ permission.' 
  })
  @ApiResponse({ status: 200, description: 'Transaction history returned successfully.', isArray: true })
  @ApiResponse({ status: 401, description: 'Unauthorized. Missing or invalid Authentication.' })
  @ApiResponse({ status: 403, description: 'Forbidden. API Key missing READ permission.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error.' })
  getTransactions(@Req() req) {
    const userId = (req.user?.sub || req.apiKey?.userId) as string;
    return this.walletService.getTransactions(userId);
  }

  @Post('transfer')
  @RequirePermissions(ApiKeyPermission.TRANSFER)
  @ApiOperation({ 
    summary: 'Transfer funds to another user', 
    description: 'Transfers amount from sender wallet to recipient wallet. Atomic transaction. Requires TRANSFER permission.' 
  })
  @ApiResponse({ status: 201, description: 'Transfer completed successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request. Insufficient funds or invalid recipient.' })
  @ApiResponse({ status: 401, description: 'Unauthorized. Missing or invalid Authentication.' })
  @ApiResponse({ status: 403, description: 'Forbidden. API Key missing TRANSFER permission.' })
  @ApiResponse({ status: 404, description: 'Recipient wallet not found.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error. Transaction failed.' })
  transfer(@Req() req, @Body() transferDto: TransferDto) {
    const senderUserId = (req.user?.sub || req.apiKey?.userId) as string;
    const { recipientWalletId, amount } = transferDto;
    return this.walletService.transfer(senderUserId, recipientWalletId, amount);
  }

  @Post()
  @ApiOperation({ 
    summary: 'Create a new wallet', 
    description: 'Manually creates a wallet for the user. NOTE: Wallets are auto-created on User Signup usually.' 
  })
  @ApiResponse({ status: 201, description: 'Wallet created successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request. User already has a wallet.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error.' })
  create(@Req() req, @Body() createWalletDto: CreateWalletDto) {
      const userId = (req.user?.sub || req.apiKey?.userId) as string;
      return this.walletService.create({ ...createWalletDto, userId });
  }

  @Get()
  @RequirePermissions(ApiKeyPermission.READ)
  @ApiOperation({ summary: 'Find all wallets (Admin)', description: 'List all wallets in the system.' })
  @ApiResponse({ status: 200, description: 'List of all wallets.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Insufficient permissions.' })
  findAll() {
    return this.walletService.findAll();
  }

  @Get(':id')
  @RequirePermissions(ApiKeyPermission.READ)
  @ApiOperation({ summary: 'Find wallet by ID', description: 'Get specific wallet by its unique ID.' })
  @ApiResponse({ status: 200, description: 'Wallet details found.' })
  @ApiResponse({ status: 404, description: 'Wallet not found.' })
  findOne(@Param('id') id: string) {
    return this.walletService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update wallet', description: 'Update wallet details.' })
  @ApiResponse({ status: 200, description: 'Wallet updated.' })
  update(@Param('id') id: string, @Body() updateWalletDto: UpdateWalletDto) {
    return this.walletService.update(id, updateWalletDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove wallet', description: 'Delete a wallet permanently.' })
  @ApiResponse({ status: 200, description: 'Wallet deleted.' })
  remove(@Param('id') id: string) {
    return this.walletService.remove(id);
  }
}
