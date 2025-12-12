import { ApiProperty } from '@nestjs/swagger';

export class CreatePaystackDto {
  @ApiProperty({ description: 'User ID', example: '12345' })
  userId!: string;

  @ApiProperty({ description: 'Customer email', example: 'user@example.com' })
  email!: string;

  @ApiProperty({ description: 'Amount in Naira', example: 5000 })
  amount!: number;
}
