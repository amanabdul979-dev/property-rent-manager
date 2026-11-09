/**
 * Digital Receipt Generator Utility
 * Formats official rent receipts with Amount in Words, Rupee symbol, and Verification Stamps
 */

import { Payment } from './types';

// Convert integer to Indian English words (Lakhs, Thousands, Hundreds)
export function numberToIndianWords(num: number): string {
  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ',
    'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: number): string {
    if (n === 0) return '';
    let str = '';
    if (Math.floor(n / 10000000) > 0) {
      str += inWords(Math.floor(n / 10000000)) + 'Crore ';
      n %= 10000000;
    }
    if (Math.floor(n / 100000) > 0) {
      str += inWords(Math.floor(n / 100000)) + 'Lakh ';
      n %= 100000;
    }
    if (Math.floor(n / 1000) > 0) {
      str += inWords(Math.floor(n / 1000)) + 'Thousand ';
      n %= 1000;
    }
    if (Math.floor(n / 100) > 0) {
      str += inWords(Math.floor(n / 100)) + 'Hundred ';
      n %= 100;
    }
    if (n > 0) {
      if (n < 20) {
        str += a[n];
      } else {
        str += b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : ' ');
      }
    }
    return str;
  }

  const rounded = Math.floor(num);
  const words = inWords(rounded).trim();
  return words ? `Rupees ${words} Only` : 'Rupees Zero Only';
}

export function generateReceiptHtml(payment: Payment, landlordName = 'Shanti Niwas & Plaza Estate Management'): string {
  const receiptNo = payment.receipt_number || `RCP-${payment.id.slice(0, 8).toUpperCase()}`;
  const amountWords = numberToIndianWords(payment.amount);
  const formattedAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(payment.amount);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Rent Receipt - ${receiptNo}</title>
  <style>
    @page { size: A4; margin: 20mm; }
    body {
      font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      background: #f8fafc;
      margin: 0;
      padding: 24px;
    }
    .receipt-card {
      max-width: 720px;
      margin: 0 auto;
      background: #ffffff;
      border: 2px solid #0f172a;
      border-radius: 12px;
      padding: 36px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
      position: relative;
    }
    .watermark {
      position: absolute;
      top: 45%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-size: 80px;
      font-weight: 900;
      color: rgba(22, 163, 74, 0.08);
      pointer-events: none;
      text-transform: uppercase;
      letter-spacing: 8px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px dashed #cbd5e1;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 4px 0;
    }
    .brand-subtitle {
      font-size: 13px;
      color: #64748b;
      margin: 0;
    }
    .receipt-badge {
      text-align: right;
    }
    .receipt-title {
      font-size: 18px;
      font-weight: 700;
      color: #2563eb;
      letter-spacing: 1px;
      margin: 0;
    }
    .receipt-meta {
      font-size: 12px;
      color: #64748b;
      margin-top: 4px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 20px;
    }
    .info-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px;
    }
    .info-label {
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .info-value {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
    }
    .table-container {
      margin: 24px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th {
      background: #0f172a;
      color: #ffffff;
      font-size: 12px;
      text-transform: uppercase;
      padding: 10px 14px;
      text-align: left;
    }
    td {
      padding: 12px 14px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 14px;
    }
    .amount-highlight {
      font-size: 20px;
      font-weight: 800;
      color: #16a34a;
    }
    .words-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 6px;
      padding: 12px 16px;
      font-size: 13px;
      color: #166534;
      font-weight: 600;
      margin-bottom: 24px;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
    }
    .stamp-box {
      border: 2px solid #16a34a;
      border-radius: 8px;
      padding: 8px 16px;
      color: #16a34a;
      font-weight: 800;
      font-size: 14px;
      text-transform: uppercase;
      display: inline-block;
      transform: rotate(-3deg);
    }
    .signature-area {
      text-align: right;
    }
    .signature-line {
      border-top: 1px solid #0f172a;
      width: 180px;
      margin-bottom: 6px;
    }
    .signature-label {
      font-size: 12px;
      color: #64748b;
      font-weight: 600;
    }
    @media print {
      body { background: #fff; padding: 0; }
      .receipt-card { border: none; box-shadow: none; padding: 10px; }
      .no-print { display: none !important; }
    }
    .print-actions {
      max-width: 720px;
      margin: 16px auto;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
    .btn {
      padding: 8px 18px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      border: none;
    }
    .btn-primary { background: #2563eb; color: #fff; }
    .btn-secondary { background: #e2e8f0; color: #1e293b; }
  </style>
</head>
<body>
  <div class="print-actions no-print">
    <button class="btn btn-secondary" onclick="window.close()">Close</button>
    <button class="btn btn-primary" onclick="window.print()">Print / Save as PDF</button>
  </div>

  <div class="receipt-card">
    <div class="watermark">PAID & VERIFIED</div>

    <div class="header">
      <div>
        <h1 class="brand-title">${landlordName}</h1>
        <p class="brand-subtitle">Residential & Commercial Properties Management</p>
      </div>
      <div class="receipt-badge">
        <h2 class="receipt-title">RENT PAYMENT RECEIPT</h2>
        <div class="receipt-meta">Receipt No: <strong>${receiptNo}</strong></div>
        <div class="receipt-meta">Date: <strong>${payment.date}</strong></div>
      </div>
    </div>

    <div class="grid-2">
      <div class="info-box">
        <div class="info-label">Tenant Details</div>
        <div class="info-value">${payment.tenant_name || 'Valued Tenant'}</div>
        <div style="font-size: 13px; color: #64748b; margin-top: 2px;">Phone: ${payment.tenant_phone || 'N/A'}</div>
      </div>
      <div class="info-box">
        <div class="info-label">Rented Unit Details</div>
        <div class="info-value">${payment.unit_code || 'Unit'} (${payment.unit_type || 'Property'})</div>
        <div style="font-size: 13px; color: #64748b; margin-top: 2px;">Month of Rent: <strong>${payment.month}</strong></div>
      </div>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Payment Mode</th>
            <th>Transaction Ref / UTR</th>
            <th style="text-align: right;">Amount (INR)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Monthly Rent for ${payment.unit_code}</strong><br>
              <span style="font-size: 12px; color: #64748b;">Period: ${payment.month}</span>
            </td>
            <td><strong>${payment.payment_method}</strong></td>
            <td><code style="font-size: 12px; background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">${payment.reference_id || 'CASH-VERIFIED'}</code></td>
            <td style="text-align: right;" class="amount-highlight">${formattedAmount}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="words-box">
      <strong>Amount in Words:</strong> ${amountWords}
    </div>

    <div class="footer">
      <div>
        <div class="stamp-box">
          ✓ PAYMENT ${payment.status.toUpperCase()}<br>
          <span style="font-size: 10px; font-weight: normal;">Confirmed by ${payment.confirmed_by || 'Landlord'}</span>
        </div>
        <div style="font-size: 11px; color: #94a3b8; margin-top: 8px;">
          This is a computer-generated digital receipt.
        </div>
      </div>
      <div class="signature-area">
        <div class="signature-line"></div>
        <div class="signature-label">Authorized Signature</div>
        <div style="font-size: 11px; color: #64748b;">Landlord / Authorized Trustee</div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}
