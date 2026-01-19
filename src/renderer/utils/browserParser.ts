// Browser-compatible file parser for CSV and PDF files
import Papa from 'papaparse';

// PDF.js with Vite-compatible worker setup
let pdfjsLib: typeof import('pdfjs-dist') | null = null;
let pdfjsInitialized = false;

async function initPdfJs(): Promise<typeof import('pdfjs-dist')> {
  if (pdfjsLib && pdfjsInitialized) return pdfjsLib;
  
  pdfjsLib = await import('pdfjs-dist');
  
  // Import the worker using Vite's worker import syntax
  const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker.default;
  
  pdfjsInitialized = true;
  return pdfjsLib;
}

export interface ParsedTransaction {
  date: string;
  description: string;
  remarks: string;
  amount: number;
  type: 'credit' | 'debit';
  balance: number | null;
  reference: string;
  mode: string;
  category?: string;
  merchant?: string;
}

export class BrowserFileParser {
  private categorizer: TransactionCategorizer;

  constructor() {
    this.categorizer = new TransactionCategorizer();
  }

  async parseFile(file: File): Promise<ParsedTransaction[]> {
    const ext = file.name.split('.').pop()?.toLowerCase();

    console.log(`Parsing file: ${file.name} (${ext})`);

    if (ext === 'csv') {
      return this.parseCSV(file);
    } else if (ext === 'pdf') {
      return this.parsePDF(file);
    } else if (ext === 'xlsx' || ext === 'xls') {
      throw new Error('Excel files are not yet supported in browser mode. Please convert to CSV first.');
    } else {
      throw new Error(`Unsupported file format: ${ext}`);
    }
  }

  private async parseCSV(file: File): Promise<ParsedTransaction[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.toLowerCase().trim(),
        complete: (results) => {
          try {
            const transactions = this.processCSVRows(results.data as Record<string, string>[]);
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

  private processCSVRows(rows: Record<string, string>[]): ParsedTransaction[] {
    if (rows.length === 0) return [];

    const transactions: ParsedTransaction[] = [];
    const firstRow = rows[0];
    
    // Find columns
    const dateCol = this.findColumn(firstRow, ['date', 'txn date', 'transaction date', 'value date']);
    const descCol = this.findColumn(firstRow, ['description', 'narration', 'particulars', 'details']);
    const debitCol = this.findColumn(firstRow, ['debit', 'withdrawal', 'dr']);
    const creditCol = this.findColumn(firstRow, ['credit', 'deposit', 'cr']);
    const amountCol = this.findColumn(firstRow, ['amount', 'transaction amount']);
    const balanceCol = this.findColumn(firstRow, ['balance', 'closing balance']);
    const typeCol = this.findColumn(firstRow, ['type', 'cr/dr', 'dr/cr']);

    if (!dateCol) {
      throw new Error('Could not find date column in CSV');
    }

    for (const row of rows) {
      const dateStr = row[dateCol];
      if (!dateStr || !this.isValidDate(dateStr)) continue;

      const date = this.parseDate(dateStr);
      const description = descCol ? row[descCol] || '' : '';

      let amount = 0;
      let type: 'credit' | 'debit' = 'debit';

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
        type = typeValue.includes('cr') || typeValue.includes('credit') ? 'credit' : 'debit';
      } else if (amountCol) {
        const rawAmount = row[amountCol] || '';
        amount = Math.abs(this.parseAmount(rawAmount));
        type = rawAmount.includes('-') ? 'debit' : 'credit';
      }

      if (amount <= 0) continue;

      const balance = balanceCol ? this.parseAmount(row[balanceCol] || '') : null;

      transactions.push({
        date,
        description: description.trim(),
        remarks: '',
        amount,
        type,
        balance,
        reference: '',
        mode: this.detectMode(description),
        category: this.categorizer.categorize(description),
        merchant: this.extractMerchant(description),
      });
    }

    return transactions;
  }

  private extractMerchant(description: string): string {
    // Common patterns for merchant extraction
    const patterns = [
      /(?:upi|imps|neft)[\/\-]([^\/\-@]+)/i,
      /(?:to|from)\s+([a-z\s]+?)(?:\s+on|\s+ref|\s+\d|$)/i,
      /pos[\/\-\s]+([^\/\-]+)/i,
    ];

    for (const pattern of patterns) {
      const match = description.match(pattern);
      if (match && match[1]) {
        const merchant = match[1].trim();
        if (merchant.length > 2 && merchant.length < 40) {
          return this.cleanMerchantName(merchant);
        }
      }
    }

    // Extract first significant word(s)
    const words = description.split(/[\s\/\-]+/).filter(w => 
      w.length > 2 && 
      !/^\d+$/.test(w) && 
      !['upi', 'neft', 'imps', 'rtgs', 'pos', 'ref', 'txn', 'the', 'and', 'for'].includes(w.toLowerCase())
    );

    if (words.length > 0) {
      return this.cleanMerchantName(words.slice(0, 2).join(' '));
    }

    return '';
  }

  private cleanMerchantName(name: string): string {
    return name
      .replace(/\s*(pvt|ltd|limited|private|llp|inc|corp)\s*/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private async parsePDF(file: File): Promise<ParsedTransaction[]> {
    try {
      // Initialize PDF.js
      const pdfjs = await initPdfJs();
      
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }

      const transactions = this.parsePDFText(fullText);
      
      if (transactions.length === 0) {
        throw new Error('Could not extract transactions from PDF. The format may not be supported. Try exporting as CSV from your bank.');
      }
      
      return transactions;
    } catch (error: any) {
      console.error('PDF parsing error:', error);
      throw new Error(`Failed to parse PDF: ${error.message}`);
    }
  }

  private parsePDFText(text: string): ParsedTransaction[] {
    const transactions: ParsedTransaction[] = [];
    const lines = text.split('\n');

    // Detect bank from text
    const bankName = this.detectBank(text);
    console.log('Detected bank:', bankName);

    // Generic pattern matching for transactions
    const dateRegex = /(\d{2}[\/-]\d{2}[\/-]\d{2,4}|\d{2}[\/-]\w{3}[\/-]\d{2,4})/;
    const amountRegex = /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g;

    for (const line of lines) {
      const dateMatch = line.match(dateRegex);
      if (!dateMatch) continue;

      const amounts = line.match(amountRegex);
      if (!amounts || amounts.length === 0) continue;

      // Get the last 1-3 amounts (typically: amount, balance or debit, credit, balance)
      const numericAmounts = amounts.map(a => this.parseAmount(a)).filter(a => a > 0 && a < 100000000);
      if (numericAmounts.length === 0) continue;

      // Extract description - text between date and first amount
      const dateIndex = line.indexOf(dateMatch[1]);
      const firstAmountIndex = line.indexOf(amounts[0]);
      let description = '';
      
      if (firstAmountIndex > dateIndex) {
        description = line.substring(dateIndex + dateMatch[1].length, firstAmountIndex).trim();
      }

      if (description.length < 3) continue; // Skip if description is too short

      // Determine transaction type based on keywords or position
      const isCredit = /credit|cr\b|deposit|salary|interest|refund|received/i.test(line);
      const isDebit = /debit|dr\b|withdraw|paid|payment|purchase|transfer out/i.test(line);

      const amount = numericAmounts[0];
      const balance = numericAmounts.length > 1 ? numericAmounts[numericAmounts.length - 1] : null;

      let type: 'credit' | 'debit' = 'debit';
      if (isCredit && !isDebit) {
        type = 'credit';
      } else if (numericAmounts.length >= 2) {
        // If we have debit and credit columns, check which has the value
        // This is a heuristic - the larger non-balance amount is usually the transaction
        type = 'debit'; // Default to debit for expenses
      }

      transactions.push({
        date: this.parseDate(dateMatch[1]),
        description,
        remarks: '',
        amount,
        type,
        balance,
        reference: '',
        mode: this.detectMode(description),
        category: this.categorizer.categorize(description),
        merchant: this.extractMerchant(description),
      });
    }

    return transactions;
  }

  private detectBank(text: string): string {
    const banks: Record<string, RegExp> = {
      'SBI': /state bank of india|sbi/i,
      'HDFC': /hdfc bank/i,
      'ICICI': /icici bank/i,
      'Axis': /axis bank/i,
      'Kotak': /kotak/i,
      'PNB': /punjab national|pnb/i,
      'BOB': /bank of baroda|bob/i,
      'Canara': /canara bank/i,
    };

    for (const [name, regex] of Object.entries(banks)) {
      if (regex.test(text)) return name;
    }
    return 'Unknown';
  }

  private findColumn(row: Record<string, string>, candidates: string[]): string | null {
    const keys = Object.keys(row);
    for (const candidate of candidates) {
      const found = keys.find(k => k.toLowerCase().includes(candidate.toLowerCase()));
      if (found) return found;
    }
    return null;
  }

  private isValidDate(dateStr: string): boolean {
    return /\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|\d{1,2}[\/-]\w{3}[\/-]\d{2,4}/i.test(dateStr);
  }

  private parseDate(dateStr: string): string {
    const monthMap: Record<string, string> = {
      'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
      'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
      'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12',
    };

    // DD/MM/YYYY or DD-MM-YYYY
    let match = dateStr.match(/(\d{2})[\/-](\d{2})[\/-](\d{4})/);
    if (match) {
      return `${match[3]}-${match[2]}-${match[1]}`;
    }

    // DD/MM/YY
    match = dateStr.match(/(\d{2})[\/-](\d{2})[\/-](\d{2})/);
    if (match) {
      const year = parseInt(match[3]) > 50 ? `19${match[3]}` : `20${match[3]}`;
      return `${year}-${match[2]}-${match[1]}`;
    }

    // DD-MMM-YYYY or DD/MMM/YYYY
    match = dateStr.match(/(\d{2})[\/-](\w{3})[\/-](\d{4})/i);
    if (match) {
      const month = monthMap[match[2].toLowerCase()] || '01';
      return `${match[3]}-${month}-${match[1]}`;
    }

    // DD-MMM-YY
    match = dateStr.match(/(\d{2})[\/-](\w{3})[\/-](\d{2})/i);
    if (match) {
      const month = monthMap[match[2].toLowerCase()] || '01';
      const year = parseInt(match[3]) > 50 ? `19${match[3]}` : `20${match[3]}`;
      return `${year}-${month}-${match[1]}`;
    }

    return dateStr;
  }

  private parseAmount(amountStr: string): number {
    if (!amountStr) return 0;
    const cleaned = amountStr.replace(/[₹$€£,\s]/g, '').trim();
    const amount = parseFloat(cleaned);
    return isNaN(amount) ? 0 : Math.abs(amount);
  }

  private detectMode(description: string): string {
    const modes: Record<string, RegExp> = {
      'UPI': /upi|phonepe|gpay|google pay|paytm|bhim/i,
      'NEFT': /neft/i,
      'RTGS': /rtgs/i,
      'IMPS': /imps/i,
      'ATM': /atm|cash withdrawal/i,
      'Card': /debit card|credit card|pos|ecom/i,
      'Cheque': /chq|cheque|check/i,
      'Auto Debit': /auto|ecs|nach|mandate/i,
    };

    for (const [mode, regex] of Object.entries(modes)) {
      if (regex.test(description)) return mode;
    }
    return 'Other';
  }
}

// Simple categorizer for browser use
class TransactionCategorizer {
  private categories: { name: string; keywords: RegExp }[] = [
    { name: 'Food & Dining', keywords: /swiggy|zomato|restaurant|cafe|food|dining|uber eats|dominos|pizza|mcdonalds|kfc|starbucks/i },
    { name: 'Groceries', keywords: /bigbasket|grofers|blinkit|dmart|supermarket|grocery|zepto|instamart/i },
    { name: 'Shopping', keywords: /amazon|flipkart|myntra|ajio|snapdeal|shopping|mall|retail/i },
    { name: 'Transportation', keywords: /uber|ola|rapido|petrol|diesel|fuel|metro|irctc|redbus|cab|taxi/i },
    { name: 'Rent', keywords: /rent|lease|housing|accommodation|landlord/i },
    { name: 'Utilities', keywords: /electricity|water|gas|internet|broadband|jio|airtel|vodafone|bill|recharge/i },
    { name: 'Entertainment', keywords: /netflix|amazon prime|hotstar|spotify|movie|theatre|pvr|inox|bookmyshow/i },
    { name: 'Healthcare', keywords: /hospital|doctor|medicine|pharmacy|apollo|medplus|1mg|pharmeasy/i },
    { name: 'Investments', keywords: /mutual fund|sip|stock|zerodha|groww|investment|nps|ppf/i },
    { name: 'Salary', keywords: /salary|wages|payroll/i },
    { name: 'Interest Credit', keywords: /interest credit|interest earned|int\.cred/i },
    { name: 'Refund', keywords: /refund|cashback|reversal|return/i },
    { name: 'Transfer', keywords: /transfer|neft|rtgs|imps.*self|self.*transfer/i },
    { name: 'ATM Withdrawal', keywords: /atm|cash withdrawal/i },
    { name: 'EMI', keywords: /emi|loan|installment/i },
    { name: 'Credit Card Payment', keywords: /credit card|card payment|cc payment/i },
  ];

  categorize(description: string): string {
    for (const cat of this.categories) {
      if (cat.keywords.test(description)) {
        return cat.name;
      }
    }
    return 'Other';
  }
}

// Singleton instance
let parserInstance: BrowserFileParser | null = null;

export function getParser(): BrowserFileParser {
  if (!parserInstance) {
    parserInstance = new BrowserFileParser();
  }
  return parserInstance;
}
