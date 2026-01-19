import * as fs from 'fs';
import pdfParse from 'pdf-parse';

interface CreditCardTransaction {
  date: string;
  description: string;
  remarks: string;
  amount: number;
  type: 'credit' | 'debit';
  reference: string;
  merchant: string;
  category: string;
}

interface CreditCardPattern {
  name: string;
  detect: (text: string) => boolean;
  parse: (text: string) => CreditCardTransaction[];
}

export class CreditCardParser {
  private patterns: CreditCardPattern[] = [
    {
      name: 'HDFC Credit Card',
      detect: (text) => text.includes('HDFC Bank') && (text.includes('Credit Card') || text.includes('CC Statement')),
      parse: this.parseHDFCCreditCard.bind(this),
    },
    {
      name: 'ICICI Credit Card',
      detect: (text) => text.includes('ICICI Bank') && text.includes('Card Statement'),
      parse: this.parseICICICreditCard.bind(this),
    },
    {
      name: 'SBI Credit Card',
      detect: (text) => text.includes('SBI Card') || (text.includes('SBI') && text.includes('Credit Card')),
      parse: this.parseSBICreditCard.bind(this),
    },
    {
      name: 'Axis Credit Card',
      detect: (text) => text.includes('Axis Bank') && text.includes('Card Statement'),
      parse: this.parseAxisCreditCard.bind(this),
    },
    {
      name: 'Generic Credit Card',
      detect: () => true,
      parse: this.parseGeneric.bind(this),
    },
  ];

  async parse(filePath: string): Promise<CreditCardTransaction[]> {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    const text = data.text;

    for (const pattern of this.patterns) {
      if (pattern.detect(text)) {
        console.log(`Detected credit card issuer: ${pattern.name}`);
        return pattern.parse(text);
      }
    }

    return [];
  }

  private parseDate(dateStr: string): string {
    const formats = [
      { regex: /(\d{2})\/(\d{2})\/(\d{4})/, format: 'DD/MM/YYYY' },
      { regex: /(\d{2})-(\d{2})-(\d{4})/, format: 'DD-MM-YYYY' },
      { regex: /(\d{2})-(\w{3})-(\d{4})/i, format: 'DD-MMM-YYYY' },
      { regex: /(\d{2}) (\w{3}) (\d{4})/i, format: 'DD MMM YYYY' },
    ];

    const monthMap: Record<string, string> = {
      'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
      'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
      'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12',
    };

    for (const { regex, format } of formats) {
      const match = dateStr.match(regex);
      if (match) {
        if (format.includes('MMM')) {
          const month = monthMap[match[2].toLowerCase()];
          return `${match[3]}-${month}-${match[1]}`;
        }
        return `${match[3]}-${match[2]}-${match[1]}`;
      }
    }

    return dateStr;
  }

  private parseAmount(amountStr: string): number {
    const cleaned = amountStr.replace(/[₹$€£,\s]/g, '').trim();
    const amount = parseFloat(cleaned);
    return isNaN(amount) ? 0 : Math.abs(amount);
  }

  private extractMerchant(description: string): string {
    // Remove common prefixes
    let merchant = description
      .replace(/^(POS|ECOM|ONLINE|INTL|INT'?L?)\s*/i, '')
      .replace(/\s*\d{4,}.*$/, '') // Remove trailing numbers (reference/card number)
      .trim();

    // Title case
    return merchant
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private categorizeTransaction(description: string): string {
    const categories: Record<string, RegExp> = {
      'Food & Dining': /swiggy|zomato|restaurant|cafe|food|dining|uber eats|dominos|pizza|mcdonalds|kfc|starbucks/i,
      'Shopping': /amazon|flipkart|myntra|ajio|snapdeal|mall|retail|store/i,
      'Transportation': /uber|ola|rapido|petrol|fuel|parking|toll/i,
      'Entertainment': /netflix|amazon prime|hotstar|spotify|movie|theatre|pvr|inox|bookmyshow/i,
      'Travel': /makemytrip|goibibo|cleartrip|airline|hotel|booking|oyo|airbnb/i,
      'Utilities': /electricity|water|gas|internet|broadband|jio|airtel|vodafone|recharge/i,
      'Healthcare': /hospital|pharmacy|apollo|medplus|1mg|pharmeasy|netmeds/i,
      'Subscriptions': /subscription|monthly|annual|membership|premium plan/i,
      'Refund': /refund|cashback|reversal|return/i,
    };

    for (const [category, regex] of Object.entries(categories)) {
      if (regex.test(description)) {
        return category;
      }
    }

    return 'Other';
  }

  private parseHDFCCreditCard(text: string): CreditCardTransaction[] {
    const transactions: CreditCardTransaction[] = [];
    const lines = text.split('\n');

    // HDFC Credit Card format: Date | Description | Amount | Cr/Dr
    const regex = /(\d{2}[\/-]\w{3}[\/-]\d{4})\s+(.+?)\s+([\d,]+\.?\d*)\s*(Cr|Dr)?/i;

    for (const line of lines) {
      const match = line.match(regex);
      if (match) {
        const [, dateStr, description, amountStr, crDr] = match;
        const amount = this.parseAmount(amountStr);

        if (amount > 0) {
          const isCredit = crDr?.toLowerCase() === 'cr';
          transactions.push({
            date: this.parseDate(dateStr),
            description: description.trim(),
            remarks: '',
            amount,
            type: isCredit ? 'credit' : 'debit',
            reference: '',
            merchant: this.extractMerchant(description),
            category: isCredit ? 'Refund' : this.categorizeTransaction(description),
          });
        }
      }
    }

    return transactions;
  }

  private parseICICICreditCard(text: string): CreditCardTransaction[] {
    return this.parseGeneric(text);
  }

  private parseSBICreditCard(text: string): CreditCardTransaction[] {
    return this.parseGeneric(text);
  }

  private parseAxisCreditCard(text: string): CreditCardTransaction[] {
    return this.parseGeneric(text);
  }

  private parseGeneric(text: string): CreditCardTransaction[] {
    const transactions: CreditCardTransaction[] = [];
    const lines = text.split('\n');

    const dateRegex = /\d{2}[\/-]\d{2}[\/-]\d{2,4}|\d{2}[\/-]\w{3}[\/-]\d{2,4}/;
    const amountRegex = /[\d,]+\.\d{2}/;

    for (const line of lines) {
      const dateMatch = line.match(dateRegex);
      const amountMatch = line.match(amountRegex);

      if (dateMatch && amountMatch) {
        const amount = this.parseAmount(amountMatch[0]);
        if (amount < 1 || amount > 10000000) continue; // Filter unrealistic amounts

        // Extract description between date and amount
        const dateIndex = line.indexOf(dateMatch[0]);
        const amountIndex = line.indexOf(amountMatch[0]);
        const description = line.substring(dateIndex + dateMatch[0].length, amountIndex).trim();

        if (description.length < 3) continue;

        const isCredit = /cr|credit|refund|cashback/i.test(line);

        transactions.push({
          date: this.parseDate(dateMatch[0]),
          description,
          remarks: '',
          amount,
          type: isCredit ? 'credit' : 'debit',
          reference: '',
          merchant: this.extractMerchant(description),
          category: isCredit ? 'Refund' : this.categorizeTransaction(description),
        });
      }
    }

    return transactions;
  }
}

// Summary generator for credit card statements
export interface CreditCardSummary {
  totalSpending: number;
  totalPayments: number;
  cashbackReceived: number;
  transactionCount: number;
  categoryBreakdown: Record<string, number>;
  topMerchants: { merchant: string; amount: number; count: number }[];
}

export function generateCreditCardSummary(transactions: CreditCardTransaction[]): CreditCardSummary {
  const debits = transactions.filter(t => t.type === 'debit');
  const credits = transactions.filter(t => t.type === 'credit');

  const categoryBreakdown: Record<string, number> = {};
  const merchantMap = new Map<string, { amount: number; count: number }>();

  for (const txn of debits) {
    categoryBreakdown[txn.category] = (categoryBreakdown[txn.category] || 0) + txn.amount;
    
    const existing = merchantMap.get(txn.merchant) || { amount: 0, count: 0 };
    existing.amount += txn.amount;
    existing.count++;
    merchantMap.set(txn.merchant, existing);
  }

  const topMerchants = Array.from(merchantMap.entries())
    .map(([merchant, data]) => ({ merchant, ...data }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);

  return {
    totalSpending: debits.reduce((sum, t) => sum + t.amount, 0),
    totalPayments: credits.filter(t => t.category !== 'Refund').reduce((sum, t) => sum + t.amount, 0),
    cashbackReceived: credits.filter(t => t.category === 'Refund').reduce((sum, t) => sum + t.amount, 0),
    transactionCount: transactions.length,
    categoryBreakdown,
    topMerchants,
  };
}
