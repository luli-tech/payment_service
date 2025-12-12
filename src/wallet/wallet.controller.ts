import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { PaystackService } from '../paystack/paystack.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { TransferDto } from './dto/transfer-wallet.dto';
import { CreatePaystackDto } from '../paystack/dto/create-paystack.dto';
import { UnifiedAuthGuard } from '../auth/unified-auth.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { ApiKeyPermission } from '../common/enums/api-key-permission.enum';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';

@ApiTags('Wallet')
@ApiBearerAuth()
@ApiHeader({
  name: 'x-api-key',
  description: 'API Key for service access (Alternative to Bearer Token)',
  required: false,
})
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
    description:
      'Generates a Paystack payment link for the user to deposit funds. Requires DEPOSIT permission.',
  })
  @ApiResponse({
    status: 201,
    description: 'Deposit initialized successfully. Returns authorization URL.',
    type: Object,
  })
  @ApiResponse({ status: 400, description: 'Bad Request. Invalid input data.' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Missing or invalid Authentication.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. API Key missing DEPOSIT permission.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error. Paystack initialization failed.',
  })
  async deposit(@Req() req, @Body() dto: CreatePaystackDto) {
    try {
      const userId = req.user.id as string;
      
      const payload = { ...dto };
      return await this.paystackService.initialize(payload, userId, (req.user as any)?.email as string);
    } catch (error) {
       throw error;
    }
  }

  @Get('balance')
  @RequirePermissions(ApiKeyPermission.READ)
  @ApiOperation({
    summary: 'Get wallet balance',
    description:
      "Retrieves the current balance of the authenticated user's wallet. Requires READ permission.",
  })
  @ApiResponse({
    status: 200,
    description: 'Current balance returned successfully.',
    schema: { example: { balance: 15000 } },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Missing or invalid Authentication.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. API Key missing READ permission.',
  })
  @ApiResponse({ status: 404, description: 'Wallet not found for user.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error.' })
  async getBalance(@Req() req) {
    try {
      const userId = req.user.id as string;
      return await this.walletService.getBalance(userId);
    } catch (error) {
      throw error;
    }
  }

  @Get('transactions')
  @RequirePermissions(ApiKeyPermission.READ)
  @ApiOperation({
    summary: 'Get transaction history',
    description:
      'Retrieves the list of all transactions (deposits/transfers) for the user. Ordered by date. Requires READ permission.',
  })
  @ApiResponse({
    status: 200,
    description: 'Transaction history returned successfully.',
    isArray: true,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Missing or invalid Authentication.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. API Key missing READ permission.',
  })
  @ApiResponse({ status: 500, description: 'Internal Server Error.' })
  async getTransactions(@Req() req) {
    try {
      const userId = (req.user?.id || req.apiKey?.userId) as string;
      if (!userId) throw new BadRequestException('User ID could not be determined from auth context');
      return await this.walletService.getTransactions(userId);
    } catch (error) {
      throw error;
    }
  }

  @Post('transfer')
  @RequirePermissions(ApiKeyPermission.TRANSFER)
  @ApiOperation({
    summary: 'Transfer funds to another user',
    description:
      'Transfers amount from sender wallet to recipient wallet. Atomic transaction. Requires TRANSFER permission.',
  })
  @ApiResponse({ status: 201, description: 'Transfer completed successfully.' })
  @ApiResponse({
    status: 400,
    description: 'Bad Request. Insufficient funds or invalid recipient.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Missing or invalid Authentication.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. API Key missing TRANSFER permission.',
  })
  @ApiResponse({ status: 404, description: 'Recipient wallet not found.' })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error. Transaction failed.',
  })
  async transfer(@Req() req, @Body() transferDto: TransferDto) {
    try {
      const senderUserId = (req.user?.id || req.apiKey?.userId) as string;
      const { wallet_number, amount } = transferDto;
      return await this.walletService.transfer(senderUserId, wallet_number, amount);
    } catch (error) {
      throw error;
    }
  }


}
