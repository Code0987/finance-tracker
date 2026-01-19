import * as fs from 'fs';
import pdfParse from 'pdf-parse';

interface ParsedTransaction {
  date: string;
  description: string;
  remarks: string;
  amount: number;
  type: 'credit' | 'debit';
  balance: number | null;
  reference: string;
  mode: string;
}

interface BankPattern {
  name: string;
  detect: (text: string) => boolean;
  parse: (text: string) => ParsedTransaction[];
}

export class PDFParser {
  private bankPatterns: BankPattern[] = [
    {
      name: 'SBI',
      detect: (text) => text.includes('State Bank of India') || text.includes('SBI'),
      parse: this.parseSBI.bind(this),
    },
    {
      name: 'HDFC',
      detect: (text) => text.includes('HDFC Bank') || text.includes('HDFC BANK'),
      parse: this.parseHDFC.bind(this),
    },
    {
      name: 'ICICI',
      detect: (text) => text.includes('ICICI Bank') || text.includes('ICICI BANK'),
      parse: this.parseICICI.bind(this),
    },
    {
      name: 'Axis',
      detect: (text) => text.includes('Axis Bank') || text.includes('AXIS BANK'),
      parse: this.parseAxis.bind(this),
    },
    {
      name: 'Kotak',
      detect: (text) => text.includes('Kotak Mahindra') || text.includes('KOTAK'),
      parse: this.parseKotak.bind(this),
    },
    {
      name: 'PNB',
      detect: (text) => text.includes('Punjab National Bank') || text.includes('PNB'),
      parse: this.parsePNB.bind(this),
    },
    {
      name: 'BOB',
      detect: (text) => text.includes('Bank of Baroda') || text.includes('BOB'),
      parse: this.parseBOB.bind(this),
    },
    {
      name: 'Canara',
      detect: (text) => text.includes('Canara Bank'),
      parse: this.parseCanara.bind(this),
    },
    {
      name: 'Generic',
      detect: () => true,
      parse: this.parseGeneric.bind(this),
    },
  ];

  async parse(filePath: string): Promise<ParsedTransaction[]> {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    const text = data.text;

    // Detect bank and use appropriate parser
    for (const pattern of this.bankPatterns) {
      if (pattern.detect(text)) {
        console.log(`Detected bank: ${pattern.name}`);
        return pattern.parse(text);
      }
    }

    return [];
  }

  private parseDate(dateStr: string): string {
    // Handle various date formats
    const formats = [
      // DD/MM/YYYY
      /(\d{2})\/(\d{2})\/(\d{4})/,
      // DD-MM-YYYY
      /(\d{2})-(\d{2})-(\d{4})/,
      // DD MMM YYYY
      /(\d{2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})/i,
      // DD-MMM-YYYY
      /(\d{2})-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-(\d{4})/i,
      // YYYY-MM-DD
      /(\d{4})-(\d{2})-(\d{2})/,
    ];

    const monthMap: Record<string, string> = {
      'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
      'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
      'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12',
    };

    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        if (format === formats[4]) {
          // YYYY-MM-DD
          return `${match[1]}-${match[2]}-${match[3]}`;
        } else if (format === formats[2] || format === formats[3]) {
          // DD MMM YYYY or DD-MMM-YYYY
          const month = monthMap[match[2].toLowerCase()];
          return `${match[3]}-${month}-${match[1]}`;
        } else {
          // DD/MM/YYYY or DD-MM-YYYY
          return `${match[3]}-${match[2]}-${match[1]}`;
        }
      }
    }

    return dateStr;
  }

  private parseAmount(amountStr: string): number {
    // Remove currency symbols, commas, and spaces
    const cleaned = amountStr.replace(/[₹$€£,\s]/g, '').trim();
    const amount = parseFloat(cleaned);
    return isNaN(amount) ? 0 : Math.abs(amount);
  }

  private parseSBI(text: string): ParsedTransaction[] {
    const transactions: ParsedTransaction[] = [];
    const lines = text.split('\n');

    // SBI statement pattern: Date | Description | Ref No | Debit | Credit | Balance
    const transactionRegex = /(\d{2}[\/-]\d{2}[\/-]\d{4})\s+(.+?)\s+(\d+)\s+([\d,]+\.?\d*|-)?\s+([\d,]+\.?\d*|-)?\s+([\d,]+\.?\d*)/;

    for (const line of lines) {
      const match = line.match(transactionRegex);
      if (match) {
        const [, dateStr, description, reference, debitStr, creditStr, balanceStr] = match;
        const debit = debitStr && debitStr !== '-' ? this.parseAmount(debitStr) : 0;
        const credit = creditStr && creditStr !== '-' ? this.parseAmount(creditStr) : 0;

        if (debit > 0 || credit > 0) {
          transactions.push({
            date: this.parseDate(dateStr),
            description: description.trim(),
            remarks: '',
            amount: debit || credit,
            type: debit > 0 ? 'debit' : 'credit',
            balance: this.parseAmount(balanceStr),
            reference,
            mode: this.detectTransactionMode(description),
          });
        }
      }
    }

    return transactions;
  }

  private parseHDFC(text: string): ParsedTransaction[] {
    const transactions: ParsedTransaction[] = [];
    const lines = text.split('\n');

    // HDFC pattern varies - try multiple patterns
    const patterns = [
      // Date | Narration | Chq/Ref No | Value Dt | Withdrawal Amt | Deposit Amt | Closing Balance
      /(\d{2}\/\d{2}\/\d{2,4})\s+(.+?)\s+(\S+)\s+\d{2}\/\d{2}\/\d{2,4}\s+([\d,]+\.?\d*|0\.00)\s+([\d,]+\.?\d*|0\.00)\s+([\d,]+\.?\d*)/,
      // Simpler pattern
      /(\d{2}[\/-]\d{2}[\/-]\d{2,4})\s+(.+?)\s+([\d,]+\.?\d*)\s+(Dr|Cr)\s+([\d,]+\.?\d*)/i,
    ];

    for (const line of lines) {
      for (const regex of patterns) {
        const match = line.match(regex);
        if (match) {
          if (match.length >= 7) {
            const [, dateStr, description, reference, , withdrawal, deposit, balance] = match;
            const debit = this.parseAmount(withdrawal);
            const credit = this.parseAmount(deposit);

            if (debit > 0 || credit > 0) {
              transactions.push({
                date: this.parseDate(dateStr),
                description: description.trim(),
                remarks: '',
                amount: debit || credit,
                type: debit > 0 ? 'debit' : 'credit',
                balance: this.parseAmount(balance),
                reference: reference || '',
                mode: this.detectTransactionMode(description),
              });
            }
          }
          break;
        }
      }
    }

    return transactions;
  }

  private parseICICI(text: string): ParsedTransaction[] {
    const transactions: ParsedTransaction[] = [];
    const lines = text.split('\n');

    // ICICI pattern: Date | Mode | Particulars | Deposits | Withdrawals | Balance
    const transactionRegex = /(\d{2}[\/-]\d{2}[\/-]\d{4})\s+(\w+)\s+(.+?)\s+([\d,]+\.?\d*|-)?\s+([\d,]+\.?\d*|-)?\s+([\d,]+\.?\d*)/;

    for (const line of lines) {
      const match = line.match(transactionRegex);
      if (match) {
        const [, dateStr, mode, description, depositStr, withdrawalStr, balanceStr] = match;
        const deposit = depositStr && depositStr !== '-' ? this.parseAmount(depositStr) : 0;
        const withdrawal = withdrawalStr && withdrawalStr !== '-' ? this.parseAmount(withdrawalStr) : 0;

        if (deposit > 0 || withdrawal > 0) {
          transactions.push({
            date: this.parseDate(dateStr),
            description: description.trim(),
            remarks: '',
            amount: deposit || withdrawal,
            type: withdrawal > 0 ? 'debit' : 'credit',
            balance: this.parseAmount(balanceStr),
            reference: '',
            mode: mode || this.detectTransactionMode(description),
          });
        }
      }
    }

    return transactions;
  }

  private parseAxis(text: string): ParsedTransaction[] {
    const transactions: ParsedTransaction[] = [];
    const lines = text.split('\n');

    // Axis Bank pattern
    const transactionRegex = /(\d{2}[\/-]\d{2}[\/-]\d{4})\s+(.+?)\s+([\d,]+\.?\d*)\s+([\d,]+\.?\d*)\s+([\d,]+\.?\d*)/;

    for (const line of lines) {
      const match = line.match(transactionRegex);
      if (match) {
        const [, dateStr, description, debitStr, creditStr, balanceStr] = match;
        const debit = this.parseAmount(debitStr);
        const credit = this.parseAmount(creditStr);

        if (debit > 0 || credit > 0) {
          transactions.push({
            date: this.parseDate(dateStr),
            description: description.trim(),
            remarks: '',
            amount: debit || credit,
            type: debit > 0 ? 'debit' : 'credit',
            balance: this.parseAmount(balanceStr),
            reference: '',
            mode: this.detectTransactionMode(description),
          });
        }
      }
    }

    return transactions;
  }

  private parseKotak(text: string): ParsedTransaction[] {
    return this.parseGeneric(text);
  }

  private parsePNB(text: string): ParsedTransaction[] {
    return this.parseGeneric(text);
  }

  private parseBOB(text: string): ParsedTransaction[] {
    return this.parseGeneric(text);
  }

  private parseCanara(text: string): ParsedTransaction[] {
    return this.parseGeneric(text);
  }

  private parseGeneric(text: string): ParsedTransaction[] {
    const transactions: ParsedTransaction[] = [];
    const lines = text.split('\n');

    // Generic pattern to catch most formats
    const patterns = [
      // Date followed by description and amounts
      /(\d{2}[\/-]\d{2}[\/-]\d{2,4})\s+(.{10,50}?)\s+([\d,]+\.?\d*)\s*(Dr|Cr|D|C)?\s*([\d,]+\.?\d*)?/i,
      // Date, description, debit, credit, balance
      /(\d{2}[\/-]\w{3}[\/-]\d{2,4})\s+(.+?)\s+([\d,]+\.?\d*)\s+([\d,]+\.?\d*)\s+([\d,]+\.?\d*)/,
      // UPI/NEFT/IMPS transactions
      /(UPI|NEFT|IMPS|RTGS)[\/\-](.+?)\s+([\d,]+\.?\d*)/i,
    ];

    for (const line of lines) {
      for (const regex of patterns) {
        const match = line.match(regex);
        if (match) {
          const dateMatch = line.match(/\d{2}[\/-]\d{2}[\/-]\d{2,4}|\d{2}[\/-]\w{3}[\/-]\d{2,4}/);
          if (!dateMatch) continue;

          const amountMatch = line.match(/[\d,]+\.\d{2}/g);
          if (!amountMatch || amountMatch.length === 0) continue;

          const amount = this.parseAmount(amountMatch[0]);
          const isDebit = /dr|debit|withdrawal|paid|transferred/i.test(line);
          const isCredit = /cr|credit|deposit|received|credited/i.test(line);

          if (amount > 0) {
            const descriptionStart = line.indexOf(dateMatch[0]) + dateMatch[0].length;
            const descriptionEnd = line.indexOf(amountMatch[0]);
            const description = line.substring(descriptionStart, descriptionEnd).trim();

            transactions.push({
              date: this.parseDate(dateMatch[0]),
              description: description || line.substring(0, 50).trim(),
              remarks: '',
              amount,
              type: isDebit ? 'debit' : isCredit ? 'credit' : 'debit',
              balance: amountMatch.length > 1 ? this.parseAmount(amountMatch[amountMatch.length - 1]) : null,
              reference: '',
              mode: this.detectTransactionMode(line),
            });
          }
          break;
        }
      }
    }

    return transactions;
  }

  private detectTransactionMode(description: string): string {
    const modes: Record<string, RegExp> = {
      'UPI': /upi|phonepe|gpay|google pay|paytm|bhim/i,
      'NEFT': /neft/i,
      'RTGS': /rtgs/i,
      'IMPS': /imps/i,
      'ATM': /atm|cash withdrawal/i,
      'Cheque': /chq|cheque|check/i,
      'Card': /debit card|credit card|pos|ecom/i,
      'Auto Debit': /auto|ecs|nach|mandate|standing instruction|si\//i,
      'Interest': /interest|int\.cred/i,
      'Transfer': /transfer|trf/i,
    };

    for (const [mode, regex] of Object.entries(modes)) {
      if (regex.test(description)) {
        return mode;
      }
    }

    return 'Other';
  }
}
