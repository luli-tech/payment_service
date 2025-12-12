import { ApiProperty } from '@nestjs/swagger';

export class TransferDto {
  @ApiProperty({ description: 'The UUID of the recipient wallet' })
  wallet_number: string;

  @ApiProperty({ description: 'Amount to transfer in kobo', example: 5000 })
  amount: number;
}
