# Finance Tracker

A powerful desktop application for managing and analyzing bank and credit card statements. Built with Electron, React, and TypeScript.

![Finance Tracker](./assets/screenshot.png)

## Features

### 📊 Statement Import
- **Multi-format Support**: Import PDF and CSV bank statements
- **Auto-parsing**: Automatically detects and parses statements from major Indian banks
  - SBI, HDFC, ICICI, Axis, Kotak, PNB, Bank of Baroda, Canara, and more
- **Duplicate Detection**: Prevents importing the same transactions twice
- **Email Integration**: Fetch statements directly from Gmail via IMAP

### 📈 Visualizations & Analytics
- **Expense Breakdown**: Interactive pie/doughnut charts by category
- **Income vs Expenses**: Bar charts showing income, expenses, and investments over time
- **Savings Trends**: Line charts tracking monthly and cumulative savings
- **Cash Flow Analysis**: Track inflows, outflows, and running balance
- **Top Merchants**: See where you spend the most
- **Spending Trends**: Compare spending patterns across periods
- **Export Options**: Download charts as PNG or PDF

### 🏦 Multi-Account Support
- Manage multiple bank accounts and credit cards
- Color-coded accounts for easy identification
- Separate analytics for each account type
- Consolidated view across all accounts

### 🏷️ Smart Categorization
- Automatic transaction categorization based on keywords
- 20+ pre-configured expense categories
- Customizable categories with icons and colors
- Learn from user corrections

### 🔒 Privacy First
- All data stored locally on your device
- No cloud sync required
- SQLite database for reliability
- Full data export capabilities

## Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Development Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/finance-tracker.git
cd finance-tracker

# Install dependencies
npm install

# Start development server
npm run dev

# In another terminal, start Electron
npm run start
```

### Building for Production

```bash
# Build the application
npm run build

# Package for distribution
npm run package
```

## Usage

### 1. Add an Account
Navigate to **Accounts** and click "Add Account". Choose between:
- **Bank Account**: For savings/current accounts
- **Credit Card**: For credit card statements

### 2. Upload Statements
Go to the **Upload** page and:
1. Select the account you're uploading for
2. Drag & drop your PDF/CSV statement files
3. The app will automatically parse and categorize transactions

### 3. View Analytics
The **Dashboard** shows an overview of your finances:
- Summary statistics (income, expenses, savings)
- Recent transactions
- Expense breakdown by category
- Monthly trends

For detailed analysis, visit the **Analytics** page.

### 4. Manage Transactions
The **Transactions** page lets you:
- View all transactions with filters
- Edit transaction details and categories
- Delete incorrect entries
- Export data as CSV or JSON

## Supported Banks

### PDF Statement Parsers
- State Bank of India (SBI)
- HDFC Bank
- ICICI Bank
- Axis Bank
- Kotak Mahindra Bank
- Punjab National Bank (PNB)
- Bank of Baroda
- Canara Bank

### CSV Import
Works with any bank's CSV export. The parser automatically detects:
- Date column
- Description/Narration
- Debit/Credit amounts
- Balance

### Adding Support for New Banks
If your bank isn't supported, the generic parser will attempt to extract transactions. You can also:
1. Export as CSV from your bank's net banking
2. Use the generic CSV parser

## Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Electron, Node.js
- **Database**: SQLite (better-sqlite3)
- **Charts**: Chart.js, Recharts
- **PDF Parsing**: pdf-parse
- **CSV Parsing**: PapaParse
- **Email**: IMAP (node-imap)

## Project Structure

```
finance-tracker/
├── src/
│   ├── main/              # Electron main process
│   │   ├── main.ts        # Main entry point
│   │   ├── preload.ts     # Preload script for IPC
│   │   ├── database.ts    # SQLite database manager
│   │   ├── categorizer.ts # Transaction categorization
│   │   ├── emailFetcher.ts# Gmail IMAP integration
│   │   └── parsers/       # Statement parsers
│   │       ├── pdfParser.ts
│   │       └── csvParser.ts
│   └── renderer/          # React frontend
│       ├── components/    # Reusable UI components
│       ├── pages/         # Page components
│       ├── hooks/         # Custom React hooks
│       ├── store/         # Zustand state management
│       ├── types/         # TypeScript definitions
│       ├── utils/         # Utility functions
│       └── styles/        # CSS styles
├── assets/                # Static assets
├── package.json
└── README.md
```

## Configuration

### Gmail IMAP Setup

To fetch statements from Gmail:

1. Enable 2-Factor Authentication on your Google account
2. Go to Google Account → Security → App Passwords
3. Generate a new app password for "Mail"
4. Use this password in the app's Email Configuration

Settings:
- Host: `imap.gmail.com`
- Port: `993`
- TLS: Enabled

### Categories

Customize categories in **Settings → Categories**:
- Add custom keywords for automatic categorization
- Choose icons and colors
- Create expense, income, transfer, and investment categories

## Data Storage

All data is stored locally in:
- **macOS**: `~/Library/Application Support/finance-tracker/`
- **Windows**: `%APPDATA%/finance-tracker/`
- **Linux**: `~/.config/finance-tracker/`

The database file is `finance-tracker.db` (SQLite).

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Electron](https://www.electronjs.org/)
- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Chart.js](https://www.chartjs.org/)
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)

## Support

If you encounter any issues or have suggestions, please [open an issue](https://github.com/yourusername/finance-tracker/issues).
