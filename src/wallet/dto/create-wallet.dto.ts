import { ApiProperty } from '@nestjs/swagger';

export class CreateWalletDto {
  @ApiProperty({ description: 'The UUID of the user owning the wallet' })
  userId: string;
}

