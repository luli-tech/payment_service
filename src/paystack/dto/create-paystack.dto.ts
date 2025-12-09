import { ApiProperty } from '@nestjs/swagger';

export class CreatePaystackDto {
  // amount in kobo (Paystack expects integer amount)
  @ApiProperty({ description: 'Amount in kobo', example: 5000 })
  amount: number;
  // email of the payer (used by Paystack)
  @ApiProperty({ description: 'Email validation of the payer', example: 'user@example.com' })
  email: string;
  // userId of the wallet owner (will be stored in reference)
  @ApiProperty({ description: 'User ID of the wallet owner' })
  userId: string;
}

