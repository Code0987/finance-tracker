export { PDFParser } from './pdfParser';
export { CSVParser } from './csvParser';
export { CreditCardParser, generateCreditCardSummary } from './creditCardParser';

export interface ParsedTransaction {
  date: string;
  description: string;
  remarks: string;
  amount: number;
  type: 'credit' | 'debit';
  balance: number | null;
  reference: string;
  mode: string;
  merchant?: string;
  category?: string;
}

export interface ParserResult {
  success: boolean;
  transactions: ParsedTransaction[];
  bankName?: string;
  accountNumber?: string;
  statementPeriod?: {
    from: string;
    to: string;
  };
  error?: string;
}

export interface CreditCardSummary {
  totalSpending: number;
  totalPayments: number;
  cashbackReceived: number;
  transactionCount: number;
  categoryBreakdown: Record<string, number>;
  topMerchants: { merchant: string; amount: number; count: number }[];
}
