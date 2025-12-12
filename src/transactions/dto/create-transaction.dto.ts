import { ApiProperty } from '@nestjs/swagger';

export class CreateTransactionDto {
  @ApiProperty()
  userId: string;
  @ApiProperty({ enum: ['DEPOSIT', 'TRANSFER'] })
  type: 'DEPOSIT' | 'TRANSFER';
  @ApiProperty()
  amount: number;
  @ApiProperty({ enum: ['PENDING', 'SUCCESS', 'FAILED'] })
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  @ApiProperty({ required: false })
  reference?: string;
  @ApiProperty({ required: false })
  senderId?: string;
  @ApiProperty({ required: false })
  recipientId?: string;
}
