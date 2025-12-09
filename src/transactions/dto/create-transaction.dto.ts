export class CreateTransactionDto {
  userId: string;
  type: 'DEPOSIT' | 'TRANSFER';
  amount: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  reference?: string;
  senderId?: string;
  recipientId?: string;
}

