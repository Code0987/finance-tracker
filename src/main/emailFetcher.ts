import Imap from 'imap';
import { simpleParser, ParsedMail, Attachment } from 'mailparser';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { Readable } from 'stream';

interface EmailConfig {
  email: string;
  password: string;
  host: string;
  port: number;
  tls: boolean;
}

interface FetchedAttachment {
  filename: string;
  filepath: string;
  size: number;
  contentType: string;
  fromEmail: string;
  subject: string;
  date: Date;
}

export class EmailFetcher {
  private config: EmailConfig;
  private attachmentDir: string;

  constructor(config: EmailConfig) {
    this.config = config;
    this.attachmentDir = path.join(app.getPath('userData'), 'attachments');
    if (!fs.existsSync(this.attachmentDir)) {
      fs.mkdirSync(this.attachmentDir, { recursive: true });
    }
  }

  async fetchBankStatements(): Promise<FetchedAttachment[]> {
    return new Promise((resolve, reject) => {
      const imap = new Imap({
        user: this.config.email,
        password: this.config.password,
        host: this.config.host,
        port: this.config.port,
        tls: this.config.tls,
        tlsOptions: { rejectUnauthorized: false },
      });

      const attachments: FetchedAttachment[] = [];

      imap.once('ready', () => {
        imap.openBox('INBOX', true, (err) => {
          if (err) {
            reject(err);
            return;
          }

          // Search for emails with bank statement keywords
          const searchCriteria: any[] = [
            ['OR',
              ['OR',
                ['SUBJECT', 'statement'],
                ['SUBJECT', 'account statement'],
              ],
              ['OR',
                ['SUBJECT', 'bank statement'],
                ['SUBJECT', 'e-statement'],
              ],
            ],
            ['SINCE', this.getSearchDate(90)], // Last 90 days
          ];

          imap.search(searchCriteria, (searchErr, results) => {
            if (searchErr) {
              reject(searchErr);
              return;
            }

            if (!results || results.length === 0) {
              imap.end();
              resolve([]);
              return;
            }

            const fetch = imap.fetch(results, {
              bodies: '',
              struct: true,
            });

            fetch.on('message', (msg) => {
              msg.on('body', (stream: Readable) => {
                const chunks: Buffer[] = [];
                stream.on('data', (chunk: Buffer) => chunks.push(chunk));
                stream.on('end', async () => {
                  try {
                    const buffer = Buffer.concat(chunks);
                    const parsed = await simpleParser(buffer);
                    const emailAttachments = await this.processEmail(parsed);
                    attachments.push(...emailAttachments);
                  } catch (parseErr) {
                    console.error('Error parsing email:', parseErr);
                  }
                });
              });
            });

            fetch.once('error', (fetchErr) => {
              reject(fetchErr);
            });

            fetch.once('end', () => {
              imap.end();
              resolve(attachments);
            });
          });
        });
      });

      imap.once('error', (imapErr: Error) => {
        reject(imapErr);
      });

      imap.connect();
    });
  }

  private async processEmail(parsed: ParsedMail): Promise<FetchedAttachment[]> {
    const attachments: FetchedAttachment[] = [];

    if (!parsed.attachments || parsed.attachments.length === 0) {
      return attachments;
    }

    for (const attachment of parsed.attachments) {
      // Filter for relevant file types
      const ext = path.extname(attachment.filename || '').toLowerCase();
      if (!['.pdf', '.csv', '.xlsx', '.xls'].includes(ext)) {
        continue;
      }

      // Check if it looks like a bank statement
      const filename = attachment.filename || 'attachment';
      const isStatement = this.isLikelyBankStatement(
        filename,
        parsed.subject || '',
        parsed.from?.text || ''
      );

      if (!isStatement) {
        continue;
      }

      // Save attachment
      const savedPath = await this.saveAttachment(attachment, parsed.date || new Date());
      
      attachments.push({
        filename,
        filepath: savedPath,
        size: attachment.size,
        contentType: attachment.contentType,
        fromEmail: parsed.from?.text || '',
        subject: parsed.subject || '',
        date: parsed.date || new Date(),
      });
    }

    return attachments;
  }

  private isLikelyBankStatement(filename: string, subject: string, from: string): boolean {
    const combinedText = `${filename} ${subject} ${from}`.toLowerCase();
    
    const bankKeywords = [
      'sbi', 'hdfc', 'icici', 'axis', 'kotak', 'pnb', 'bob', 'canara',
      'idfc', 'yes bank', 'rbl', 'indusind', 'federal bank', 'bandhan',
      'statement', 'e-statement', 'account statement', 'bank statement',
      'transaction', 'credit card', 'cc statement'
    ];

    return bankKeywords.some(keyword => combinedText.includes(keyword));
  }

  private async saveAttachment(attachment: Attachment, emailDate: Date): Promise<string> {
    const dateStr = emailDate.toISOString().split('T')[0];
    const filename = `${dateStr}_${attachment.filename || 'statement'}`;
    const filepath = path.join(this.attachmentDir, filename);

    // Avoid duplicates
    if (fs.existsSync(filepath)) {
      return filepath;
    }

    fs.writeFileSync(filepath, attachment.content);
    return filepath;
  }

  private getSearchDate(daysAgo: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date;
  }

  // Gmail specific - get app password instructions
  static getGmailInstructions(): string {
    return `
To connect Gmail with IMAP:

1. Enable 2-Factor Authentication on your Google account
2. Go to Google Account Settings > Security > App Passwords
3. Generate a new app password for "Mail" on "Other (Custom name)"
4. Use this app password instead of your regular password

IMAP Settings for Gmail:
- Host: imap.gmail.com
- Port: 993
- TLS: Yes

Note: You may also need to enable IMAP access in Gmail settings:
Settings > See all settings > Forwarding and POP/IMAP > Enable IMAP
    `.trim();
  }

  // Common bank email domains for validation
  static getBankEmailDomains(): string[] {
    return [
      'sbi.co.in',
      'hdfcbank.com',
      'icicibank.com',
      'axisbank.com',
      'kotak.com',
      'pnb.co.in',
      'bankofbaroda.co.in',
      'canarabank.com',
      'idfcfirstbank.com',
      'yesbank.in',
      'rblbank.com',
      'indusind.com',
      'federalbank.co.in',
      'bandhanbank.com',
    ];
  }
}
