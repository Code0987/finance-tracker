import * as fs from 'fs';
import Papa from 'papaparse';

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

interface ColumnMapping {
  date: string[];
  description: string[];
  remarks: string[];
  debit: string[];
  credit: string[];
  amount: string[];
  balance: string[];
  reference: string[];
  type: string[];
}

export class CSVParser {
  private columnMappings: ColumnMapping = {
    date: ['date', 'txn date', 'transaction date', 'value date', 'posting date', 'trans date', 'tran date', 'dt'],
    description: ['description', 'narration', 'particulars', 'transaction details', 'remarks', 'details', 'desc', 'transaction description', 'txn details'],
    remarks: ['remarks', 'notes', 'memo', 'additional info', 'comment'],
    debit: ['debit', 'withdrawal', 'withdrawals', 'debit amount', 'dr', 'amount debited', 'debit(rs)', 'withdrawn'],
    credit: ['credit', 'deposit', 'deposits', 'credit amount', 'cr', 'amount credited', 'credit(rs)', 'deposited'],
    amount: ['amount', 'transaction amount', 'txn amount', 'value', 'amt'],
    balance: ['balance', 'closing balance', 'available balance', 'running balance', 'bal', 'closing bal'],
    reference: ['reference', 'ref no', 'reference number', 'ref', 'transaction id', 'txn id', 'chq no', 'cheque no', 'utr'],
    type: ['type', 'transaction type', 'txn type', 'cr/dr', 'dr/cr'],
  };

  async parse(filePath: string): Promise<ParsedTransaction[]> {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    return new Promise((resolve, reject) => {
      Papa.parse(content, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.toLowerCase().trim(),
        complete: (results) => {
          try {
            const transactions = this.processRows(results.data as Record<string, string>[]);
            resolve(transactions);
          } catch (error) {
            reject(error);
          }
        },
        error: (error: Error) => {
          reject(error);
        },
      });
    });
  }

  private findColumn(row: Record<string, string>, candidates: string[]): string | null {
    const keys = Object.keys(row);
    for (const candidate of candidates) {
      const found = keys.find(k => k.toLowerCase().includes(candidate.toLowerCase()));
      if (found) return found;
    }
    return null;
  }

  private processRows(rows: Record<string, string>[]): ParsedTransaction[] {
    if (rows.length === 0) return [];

    const firstRow = rows[0];
    const dateCol = this.findColumn(firstRow, this.columnMappings.date);
    const descCol = this.findColumn(firstRow, this.columnMappings.description);
    const remarksCol = this.findColumn(firstRow, this.columnMappings.remarks);
    const debitCol = this.findColumn(firstRow, this.columnMappings.debit);
    const creditCol = this.findColumn(firstRow, this.columnMappings.credit);
    const amountCol = this.findColumn(firstRow, this.columnMappings.amount);
    const balanceCol = this.findColumn(firstRow, this.columnMappings.balance);
    const referenceCol = this.findColumn(firstRow, this.columnMappings.reference);
    const typeCol = this.findColumn(firstRow, this.columnMappings.type);

    if (!dateCol) {
      throw new Error('Could not find date column in CSV');
    }

    const transactions: ParsedTransaction[] = [];

    for (const row of rows) {
      const dateStr = row[dateCol];
      if (!dateStr || !this.isValidDate(dateStr)) continue;

      const date = this.parseDate(dateStr);
      const description = descCol ? row[descCol] || '' : '';
      const remarks = remarksCol ? row[remarksCol] || '' : '';
      const reference = referenceCol ? row[referenceCol] || '' : '';

      let amount = 0;
      let type: 'credit' | 'debit' = 'debit';

      // Determine amount and type
      if (debitCol && creditCol) {
        const debitAmount = this.parseAmount(row[debitCol] || '');
        const creditAmount = this.parseAmount(row[creditCol] || '');

        if (debitAmount > 0) {
          amount = debitAmount;
          type = 'debit';
        } else if (creditAmount > 0) {
          amount = creditAmount;
          type = 'credit';
        }
      } else if (amountCol && typeCol) {
        amount = this.parseAmount(row[amountCol] || '');
        const typeValue = row[typeCol]?.toLowerCase() || '';
        type = typeValue.includes('cr') || typeValue.includes('credit') || typeValue === 'c' ? 'credit' : 'debit';
      } else if (amountCol) {
        const rawAmount = row[amountCol] || '';
        amount = this.parseAmount(rawAmount);
        // Negative amounts are typically debits
        type = rawAmount.includes('-') || rawAmount.includes('(') ? 'debit' : 'credit';
        amount = Math.abs(amount);
      }

      if (amount <= 0) continue;

      const balance = balanceCol ? this.parseAmount(row[balanceCol] || '') : null;

      transactions.push({
        date,
        description: description.trim(),
        remarks: remarks.trim(),
        amount,
        type,
        balance: balance || null,
        reference: reference.trim(),
        mode: this.detectTransactionMode(description + ' ' + remarks),
      });
    }

    return transactions;
  }

  private isValidDate(dateStr: string): boolean {
    // Check if string contains date-like patterns
    return /\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|\d{4}[\/-]\d{1,2}[\/-]\d{1,2}|\d{1,2}[\/-]\w{3}[\/-]\d{2,4}/i.test(dateStr);
  }

  private parseDate(dateStr: string): string {
    const formats = [
      { regex: /(\d{2})\/(\d{2})\/(\d{4})/, format: 'DD/MM/YYYY' },
      { regex: /(\d{2})-(\d{2})-(\d{4})/, format: 'DD-MM-YYYY' },
      { regex: /(\d{4})-(\d{2})-(\d{2})/, format: 'YYYY-MM-DD' },
      { regex: /(\d{2})\/(\d{2})\/(\d{2})/, format: 'DD/MM/YY' },
      { regex: /(\d{2})-(\w{3})-(\d{4})/i, format: 'DD-MMM-YYYY' },
      { regex: /(\d{2})\/(\w{3})\/(\d{4})/i, format: 'DD/MMM/YYYY' },
      { regex: /(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/, format: 'D/M/YYYY' },
    ];

    const monthMap: Record<string, string> = {
      'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
      'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
      'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12',
    };

    for (const { regex, format } of formats) {
      const match = dateStr.match(regex);
      if (match) {
        switch (format) {
          case 'YYYY-MM-DD':
            return `${match[1]}-${match[2]}-${match[3]}`;
          case 'DD/MM/YY':
            const year = parseInt(match[3]) > 50 ? `19${match[3]}` : `20${match[3]}`;
            return `${year}-${match[2]}-${match[1]}`;
          case 'DD-MMM-YYYY':
          case 'DD/MMM/YYYY':
            const month = monthMap[match[2].toLowerCase()];
            return `${match[3]}-${month}-${match[1].padStart(2, '0')}`;
          case 'D/M/YYYY':
            return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
          default:
            return `${match[3]}-${match[2]}-${match[1]}`;
        }
      }
    }

    // Try to parse as Date object as fallback
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }

    return dateStr;
  }

  private parseAmount(amountStr: string): number {
    if (!amountStr) return 0;
    // Remove currency symbols, commas, spaces, and handle parentheses for negative
    let cleaned = amountStr.replace(/[₹$€£,\s]/g, '').trim();
    const isNegative = cleaned.includes('(') && cleaned.includes(')');
    cleaned = cleaned.replace(/[()]/g, '');
    
    const amount = parseFloat(cleaned);
    if (isNaN(amount)) return 0;
    return isNegative ? -amount : amount;
  }

  private detectTransactionMode(text: string): string {
    const modes: Record<string, RegExp> = {
      'UPI': /upi|phonepe|gpay|google pay|paytm|bhim/i,
      'NEFT': /neft/i,
      'RTGS': /rtgs/i,
      'IMPS': /imps/i,
      'ATM': /atm|cash withdrawal/i,
      'Cheque': /chq|cheque|check/i,
      'Card': /debit card|credit card|pos|ecom/i,
      'Auto Debit': /auto|ecs|nach|mandate|standing instruction/i,
      'Interest': /interest|int\.cred/i,
      'Transfer': /transfer|trf/i,
      'EMI': /emi|loan/i,
    };

    for (const [mode, regex] of Object.entries(modes)) {
      if (regex.test(text)) {
        return mode;
      }
    }

    return 'Other';
  }
}
