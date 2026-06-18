import { ReceiptData } from '../types/types-pdf-generator';

export const receiptTemplate = (data: ReceiptData): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Receipt - ${data.receiptNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; padding: 40px; color: #333; background: #fff; }
    .receipt { max-width: 800px; margin: 0 auto; border: 2px solid #333; padding: 30px; }
    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 20px; }
    .header h1 { font-size: 24px; color: #1a5276; margin-bottom: 5px; }
    .header h2 { font-size: 18px; color: #555; font-weight: normal; }
    .header p { font-size: 12px; color: #777; margin-top: 5px; }
    .receipt-meta { display: flex; justify-content: space-between; margin-bottom: 20px; padding: 10px; background: #f8f9fa; border-radius: 4px; }
    .receipt-meta div { font-size: 14px; }
    .receipt-meta strong { color: #1a5276; }
    .details-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .details-table td { padding: 10px 15px; border-bottom: 1px solid #eee; font-size: 14px; }
    .details-table td:first-child { font-weight: bold; color: #555; width: 40%; background: #f8f9fa; }
    .details-table td:last-child { color: #333; }
    .amount-row td { font-size: 18px !important; font-weight: bold !important; background: #e8f4f8 !important; color: #1a5276 !important; }
    .footer { margin-top: 30px; padding-top: 15px; border-top: 1px dashed #ccc; }
    .footer .note { font-size: 11px; color: #888; text-align: center; font-style: italic; }
    .signatures { display: flex; justify-content: space-between; margin-top: 50px; }
    .signatures div { text-align: center; width: 200px; }
    .signatures .line { border-top: 1px solid #333; padding-top: 5px; font-size: 12px; color: #555; }
    @media print { body { padding: 0; } .receipt { border: none; } }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <h1>${data.societyName}</h1>
      <h2>Payment Receipt</h2>
      ${data.societyAddress ? `<p>${data.societyAddress}</p>` : ''}
      ${data.societyPhone ? `<p>Phone: ${data.societyPhone}</p>` : ''}
    </div>

    <div class="receipt-meta">
      <div><strong>Receipt No:</strong> ${data.receiptNumber}</div>
      <div><strong>Date:</strong> ${data.date}</div>
    </div>

    <table class="details-table">
      <tr><td>Member Name:</td><td>${data.memberName}</td></tr>
      <tr><td>Member ID:</td><td>${data.memberId}</td></tr>
      ${data.memberCNIC ? `<tr><td>CNIC:</td><td>${data.memberCNIC}</td></tr>` : ''}
      <tr><td>Plot Number:</td><td>${data.plotNumber}</td></tr>
      ${data.plotBlock ? `<tr><td>Block:</td><td>${data.plotBlock}</td></tr>` : ''}
      ${data.plotSize ? `<tr><td>Plot Size:</td><td>${data.plotSize}</td></tr>` : ''}
      <tr><td>Payment Mode:</td><td>${data.paymentMode}</td></tr>
      ${data.transactionId ? `<tr><td>Transaction ID:</td><td>${data.transactionId}</td></tr>` : ''}
      ${data.description ? `<tr><td>Description:</td><td>${data.description}</td></tr>` : ''}
      <tr class="amount-row"><td>Amount Paid:</td><td>PKR ${data.amount.toLocaleString()}</td></tr>
      ${data.amountInWords ? `<tr><td>Amount in Words:</td><td>${data.amountInWords}</td></tr>` : ''}
      ${data.remarks ? `<tr><td>Remarks:</td><td>${data.remarks}</td></tr>` : ''}
    </table>

    <div class="signatures">
      <div>
        <div class="line">Member Signature</div>
      </div>
      <div>
        <div class="line">${data.receivedBy || 'Authorized Signatory'}</div>
      </div>
    </div>

    <div class="footer">
      <p class="note">This is a computer-generated receipt. No signature is required for electronic payments.</p>
    </div>
  </div>
</body>
</html>`;
