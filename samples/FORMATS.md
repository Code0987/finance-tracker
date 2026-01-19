# Supported Statement Formats

This document describes the bank statement formats supported by Finance Tracker.

## CSV Formats

### Standard Format
The most common CSV format with separate debit and credit columns:

```csv
Date,Description,Debit,Credit,Balance
01/01/2024,SALARY JAN 2024,,75000.00,125000.00
03/01/2024,UPI/SWIGGY,450.00,,124550.00
```

### Alternative Format (Single Amount with Type)
Some banks provide amount with Dr/Cr indicator:

```csv
Transaction Date,Description,Amount,Type
02/01/2024,AMAZON.IN,3500.00,Dr
05/01/2024,REFUND,500.00,Cr
```

### HDFC Format
```csv
Date,Narration,Chq./Ref.No.,Value Dt,Withdrawal Amt.,Deposit Amt.,Closing Balance
01/01/24,NEFT-XYZ,REF123,01/01/24,0.00,75000.00,125000.00
```

### ICICI Format
```csv
S No.,Value Date,Txn Date,Cheque Number,Transaction Remarks,Deposit Amount,Withdrawal Amount,Balance
1,01-Jan-2024,01-Jan-2024,,SALARY CREDIT,75000.00,0.00,125000.00
```

## PDF Formats

### SBI Statement
- Statement contains "State Bank of India" or "SBI" header
- Transaction lines: Date | Description | Ref No | Debit | Credit | Balance

### HDFC Statement  
- Statement contains "HDFC Bank" header
- Transaction lines: Date | Narration | Chq/Ref No | Value Dt | Withdrawal | Deposit | Balance

### ICICI Statement
- Statement contains "ICICI Bank" header
- Transaction lines: Date | Mode | Particulars | Deposits | Withdrawals | Balance

### Axis Bank Statement
- Statement contains "Axis Bank" header
- Transaction lines: Date | Description | Debit | Credit | Balance

## Date Formats

The following date formats are automatically detected:

- `DD/MM/YYYY` (e.g., 01/01/2024)
- `DD-MM-YYYY` (e.g., 01-01-2024)
- `YYYY-MM-DD` (e.g., 2024-01-01)
- `DD/MM/YY` (e.g., 01/01/24)
- `DD-MMM-YYYY` (e.g., 01-Jan-2024)
- `DD MMM YYYY` (e.g., 01 Jan 2024)

## Amount Formats

- Numbers with commas: `75,000.00`
- Numbers without commas: `75000.00`
- Currency symbols: `₹75,000.00` or `$75,000.00`
- Negative amounts: `-5000.00` or `(5000.00)`

## Tips for Successful Import

1. **Use CSV when available**: PDF parsing is more complex and may miss some transactions
2. **Check dates**: Ensure dates are in a consistent format
3. **Verify amounts**: Check that debit/credit columns are correctly identified
4. **Review categories**: After import, review and correct any miscategorized transactions
5. **Remove duplicates**: The app will warn about potential duplicates

## Adding New Bank Support

If your bank's format isn't recognized:

1. Try the generic CSV parser by exporting your statement as CSV
2. Open an issue with a sample (with personal data removed)
3. Consider contributing a parser for your bank

## Credit Card Statement Notes

Credit card statements typically show:
- All transactions as debits (purchases)
- Credits for refunds, cashback, and payments
- No running balance (outstanding amount shown separately)

The app will:
- Categorize all credit card purchases as expenses
- Track credit card payments as transfers (when linked to bank account)
- Calculate total spending per card
