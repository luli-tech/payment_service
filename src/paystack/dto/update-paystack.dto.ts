// import { PartialType } from '@nestjs/mapped-types';
// import { CreatePaystackDto } from './create-paystack.dto';

// export class UpdatePaystackDto extends PartialType(CreatePaystackDto) {}
export class UpdatePaystackDto {
  status?: string;
}
