import { ApiProperty } from '@nestjs/swagger';

export class CreatePaystackDto {
  // amount in kobo (Paystack expects integer amount)
  @ApiProperty({ description: 'Amount in kobo', example: 5000 })
  amount: number;
}

