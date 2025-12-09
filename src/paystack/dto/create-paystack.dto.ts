export class CreatePaystackDto {
  // amount in kobo (Paystack expects integer amount)
  amount: number;
  // email of the payer (used by Paystack)
  email: string;
  // userId of the wallet owner (will be stored in reference)
  userId: string;
}

