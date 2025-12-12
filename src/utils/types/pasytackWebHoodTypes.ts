export interface PaystackWebhookEvent {
  event: string;
  data: {
    id: number;
    status: string;
    reference: string;
    amount: number;
    paid_at: string;
    created_at: string;
    customer: {
      email: string;
      [key: string]: any;
    };
    [key: string]: any;
  };
  [key: string]: any;
}
