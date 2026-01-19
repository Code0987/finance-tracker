interface CategoryRule {
  name: string;
  keywords: string[];
  patterns: RegExp[];
}

export class TransactionCategorizer {
  private categories: CategoryRule[] = [
    {
      name: 'Food & Dining',
      keywords: ['swiggy', 'zomato', 'restaurant', 'cafe', 'food', 'dining', 'uber eats', 'dominos', 'pizza', 'mcdonalds', 'kfc', 'starbucks', 'burger', 'hotel', 'dhaba', 'mess', 'canteen', 'kitchen', 'biryani', 'dine', 'eatery', 'barbeque', 'bbq', 'brewpub', 'pub'],
      patterns: [/food|dine|eat|restaurant|cafe|bistro|pizzeria/i],
    },
    {
      name: 'Groceries',
      keywords: ['bigbasket', 'grofers', 'blinkit', 'dmart', 'reliance fresh', 'more', 'supermarket', 'grocery', 'vegetables', 'fruits', 'zepto', 'instamart', 'jiomart', 'nature basket', 'spencer', 'star bazaar', 'hypermarket'],
      patterns: [/grocery|grocer|vegetable|fruit|supermarket|mart\b/i],
    },
    {
      name: 'Shopping',
      keywords: ['amazon', 'flipkart', 'myntra', 'ajio', 'snapdeal', 'shopping', 'mall', 'retail', 'clothes', 'electronics', 'meesho', 'nykaa', 'tata cliq', 'lifestyle', 'pantaloons', 'westside', 'shoppers stop', 'reliance digital', 'croma', 'vijay sales'],
      patterns: [/shop|store|retail|mall|boutique|mart$/i],
    },
    {
      name: 'Transportation',
      keywords: ['uber', 'ola', 'rapido', 'petrol', 'diesel', 'fuel', 'metro', 'bus', 'train', 'irctc', 'redbus', 'cab', 'taxi', 'iocl', 'hpcl', 'bpcl', 'indian oil', 'bharat petroleum', 'shell', 'parking', 'toll', 'fastag', 'meru', 'megacabs'],
      patterns: [/fuel|petrol|diesel|cab|taxi|transport|metro|railway|toll|parking/i],
    },
    {
      name: 'Rent',
      keywords: ['rent', 'lease', 'housing', 'accommodation', 'pg', 'hostel', 'landlord', 'flat rent', 'house rent', 'monthly rent'],
      patterns: [/\brent\b|lease|landlord|accommodation/i],
    },
    {
      name: 'Utilities',
      keywords: ['electricity', 'water', 'gas', 'internet', 'broadband', 'wifi', 'jio', 'airtel', 'vodafone', 'bsnl', 'bill', 'recharge', 'dth', 'tata sky', 'dish tv', 'piped gas', 'mahanagar gas', 'indraprastha gas', 'adani gas', 'bescom', 'mseb', 'bses'],
      patterns: [/electric|water bill|gas bill|internet|broadband|mobile|recharge|dth|cable/i],
    },
    {
      name: 'Entertainment',
      keywords: ['netflix', 'amazon prime', 'hotstar', 'spotify', 'youtube', 'movie', 'theatre', 'pvr', 'inox', 'game', 'play', 'disney', 'zee5', 'sonyliv', 'voot', 'aha', 'bookmyshow', 'paytm movies', 'entertainment', 'gaming', 'steam', 'playstation', 'xbox'],
      patterns: [/movie|theatre|cinema|gaming|entertainment|streaming|concert|show|event/i],
    },
    {
      name: 'Healthcare',
      keywords: ['hospital', 'doctor', 'medicine', 'pharmacy', 'apollo', 'medplus', '1mg', 'pharmeasy', 'netmeds', 'clinic', 'medical', 'health', 'diagnostic', 'lab', 'pathology', 'dr.', 'fortis', 'max', 'manipal', 'aiims', 'dental', 'eye', 'optical'],
      patterns: [/hospital|clinic|medical|pharmacy|health|doctor|diagnostic|pathology/i],
    },
    {
      name: 'Education',
      keywords: ['school', 'college', 'university', 'course', 'udemy', 'coursera', 'books', 'tuition', 'fees', 'education', 'training', 'coaching', 'institute', 'academy', 'unacademy', 'byju', 'vedantu', 'whitehat', 'simplilearn', 'upgrad'],
      patterns: [/school|college|university|education|tuition|course|training|academy|coaching/i],
    },
    {
      name: 'Insurance',
      keywords: ['insurance', 'lic', 'hdfc life', 'icici prudential', 'premium', 'policy', 'sbi life', 'max life', 'bajaj allianz', 'tata aia', 'birla sun life', 'health insurance', 'term insurance', 'car insurance', 'bike insurance'],
      patterns: [/insurance|premium|policy|lic\b|life insurance|health cover/i],
    },
    {
      name: 'Investments',
      keywords: ['mutual fund', 'sip', 'stock', 'zerodha', 'groww', 'upstox', 'investment', 'nps', 'ppf', 'fd', 'fixed deposit', 'mf', 'nse', 'bse', 'kuvera', 'coin', 'angel', 'iifl', 'motilal', 'paytm money', 'et money', 'scripbox', 'rd', 'recurring deposit'],
      patterns: [/investment|sip|mutual fund|stock|nps|ppf|fixed deposit|trading/i],
    },
    {
      name: 'Salary',
      keywords: ['salary', 'wages', 'payroll', 'income', 'earning', 'stipend', 'pay'],
      patterns: [/salary|wages|payroll|stipend/i],
    },
    {
      name: 'Interest Credit',
      keywords: ['interest credit', 'interest earned', 'dividend', 'bonus', 'int cred', 'int.cred', 'interest', 'accrued interest'],
      patterns: [/interest (credit|earned)|int\.cred|dividend/i],
    },
    {
      name: 'Refund',
      keywords: ['refund', 'cashback', 'reversal', 'return', 'refunded', 'reversed', 'chargeback'],
      patterns: [/refund|cashback|reversal|return|chargeback/i],
    },
    {
      name: 'Transfer',
      keywords: ['transfer', 'neft', 'rtgs', 'imps', 'upi', 'self transfer', 'fund transfer', 'self trf', 'own account'],
      patterns: [/self transfer|own account|fund transfer|internal transfer/i],
    },
    {
      name: 'ATM Withdrawal',
      keywords: ['atm', 'cash withdrawal', 'withdrawal', 'atm wdl', 'cash wdl', 'atm-cwdr'],
      patterns: [/atm|cash withdrawal|cash wdl/i],
    },
    {
      name: 'EMI',
      keywords: ['emi', 'loan', 'installment', 'repayment', 'home loan', 'car loan', 'personal loan', 'education loan', 'equated monthly', 'emis'],
      patterns: [/\bemi\b|loan repay|installment|equated monthly/i],
    },
    {
      name: 'Credit Card Payment',
      keywords: ['credit card', 'card payment', 'cc payment', 'card bill', 'creditcard', 'cc bill', 'credit card bill', 'card due'],
      patterns: [/credit card|card payment|cc (bill|payment)/i],
    },
    {
      name: 'Travel',
      keywords: ['makemytrip', 'goibibo', 'cleartrip', 'yatra', 'air india', 'indigo', 'spicejet', 'vistara', 'air asia', 'airways', 'airlines', 'flight', 'booking', 'hotel booking', 'oyo', 'airbnb', 'trivago', 'travel'],
      patterns: [/flight|airline|airways|travel|booking|hotel/i],
    },
    {
      name: 'Subscriptions',
      keywords: ['subscription', 'monthly', 'annual', 'yearly', 'membership', 'premium', 'plan', 'subscribe'],
      patterns: [/subscription|membership|monthly plan|annual plan/i],
    },
    {
      name: 'Personal Care',
      keywords: ['salon', 'spa', 'parlour', 'parlor', 'beauty', 'grooming', 'haircut', 'facial', 'massage', 'urban company', 'urbanclap'],
      patterns: [/salon|spa|parlour|beauty|grooming|haircut/i],
    },
    {
      name: 'Donations',
      keywords: ['donation', 'charity', 'ngo', 'foundation', 'trust', 'relief', 'fund', 'help', 'covid'],
      patterns: [/donation|charity|ngo|fund raising|relief fund/i],
    },
    {
      name: 'Taxes',
      keywords: ['tax', 'income tax', 'gst', 'tds', 'advance tax', 'self assessment', 'challan', 'cess'],
      patterns: [/\btax\b|income tax|gst|tds|challan/i],
    },
  ];

  categorize(description: string): string {
    const text = description.toLowerCase();

    // First, try exact keyword matching
    for (const category of this.categories) {
      for (const keyword of category.keywords) {
        if (text.includes(keyword.toLowerCase())) {
          return category.name;
        }
      }
    }

    // Then, try pattern matching
    for (const category of this.categories) {
      for (const pattern of category.patterns) {
        if (pattern.test(text)) {
          return category.name;
        }
      }
    }

    // Default category
    return 'Other';
  }

  // Get merchant name from description
  extractMerchant(description: string): string {
    // Common patterns for merchant extraction
    const patterns = [
      // UPI patterns
      /upi[\/\-]([^\/\-]+)[\/\-]/i,
      /paid to ([^\/\-@]+)/i,
      /received from ([^\/\-@]+)/i,
      // NEFT/IMPS patterns
      /neft[\/\-]([^\/\-]+)[\/\-]/i,
      /imps[\/\-]([^\/\-]+)[\/\-]/i,
      // POS patterns
      /pos[\/\-]([^\/\-]+)/i,
      // General patterns
      /to\s+([a-z\s]+?)(?:\s+on|\s+ref|\s+\d)/i,
      /from\s+([a-z\s]+?)(?:\s+on|\s+ref|\s+\d)/i,
    ];

    for (const pattern of patterns) {
      const match = description.match(pattern);
      if (match && match[1]) {
        const merchant = match[1].trim();
        if (merchant.length > 3 && merchant.length < 50) {
          return this.cleanMerchantName(merchant);
        }
      }
    }

    // If no pattern matched, try to extract first significant part
    const parts = description.split(/[\/\-\s]+/);
    for (const part of parts) {
      if (part.length > 3 && !/^\d+$/.test(part) && !['upi', 'neft', 'imps', 'rtgs', 'pos', 'ref', 'txn'].includes(part.toLowerCase())) {
        return this.cleanMerchantName(part);
      }
    }

    return '';
  }

  private cleanMerchantName(name: string): string {
    // Remove common suffixes and clean up
    return name
      .replace(/\s*(pvt|ltd|limited|private|llp|inc|corp|co\.?)\s*/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  // Suggest new category based on uncategorized transactions
  suggestCategories(descriptions: string[]): Map<string, string[]> {
    const suggestions = new Map<string, string[]>();

    for (const desc of descriptions) {
      const category = this.categorize(desc);
      if (category === 'Other') {
        const words = desc.toLowerCase().split(/\s+/);
        for (const word of words) {
          if (word.length > 4 && !suggestions.has(word)) {
            suggestions.set(word, [desc]);
          } else if (suggestions.has(word)) {
            suggestions.get(word)!.push(desc);
          }
        }
      }
    }

    return suggestions;
  }
}
