import { PaymentReceiptData } from '../types/types-pdf-generator';

export const paymentReceiptTemplate = (data: PaymentReceiptData): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Receipt - ${data.receiptNumber}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; padding: 30px; color: #333; background: #fff; font-size: 13px; line-height: 1.5; }
    .receipt-container { max-width: 800px; margin: 0 auto; border: 2px solid #1a5276; padding: 30px; }
    .header { display: flex; align-items: flex-start; border-bottom: 3px solid #1a5276; padding-bottom: 15px; margin-bottom: 20px; gap: 15px; }
    .logo-area { width: 80px; height: 80px; border: 1px dashed #ccc; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #999; flex-shrink: 0; }
    .header-text { flex: 1; }
    .header-text h1 { font-size: 22px; color: #1a5276; text-transform: uppercase; }
    .header-text p { font-size: 11px; color: #777; }
    .receipt-badge { background: #1a5276; color: #fff; padding: 8px 20px; font-size: 18px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; text-align: center; flex-shrink: 0; }
    .receipt-meta { display: flex; justify-content: space-between; margin-bottom: 20px; padding: 10px; background: #f0f4f8; border-radius: 4px; }
    .receipt-meta .meta-item { font-size: 12px; }
    .receipt-meta .meta-item strong { color: #1a5276; }
    .member-info { display: flex; gap: 20px; margin-bottom: 20px; }
    .member-info .info-box { flex: 1; }
    .info-box h3 { font-size: 13px; color: #1a5276; text-transform: uppercase; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 8px; }
    .info-box p { font-size: 12px; color: #555; margin-bottom: 3px; }
    .payment-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .payment-table th { background: #1a5276; color: #fff; padding: 10px 12px; text-align: left; font-size: 12px; text-transform: uppercase; }
    .payment-table td { padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 13px; }
    .payment-table tr:nth-child(even) { background: #f8f9fa; }
    .payment-table .amount-col { text-align: right; }
    .payment-table .sno-col { width: 50px; text-align: center; }
    .total-section { display: flex; justify-content: flex-end; margin-bottom: 20px; }
    .total-box { width: 300px; border: 2px solid #1a5276; border-radius: 4px; overflow: hidden; }
    .total-box .total-row { display: flex; justify-content: space-between; padding: 8px 15px; font-size: 13px; }
    .total-box .total-row.grand { background: #1a5276; color: #fff; font-weight: bold; font-size: 16px; }
    .payment-mode { display: flex; gap: 15px; margin-bottom: 20px; padding: 12px; background: #f8f9fa; border: 1px solid #e0e0e0; border-radius: 4px; }
    .payment-mode .mode-item { font-size: 12px; }
    .payment-mode .mode-item strong { color: #1a5276; }
    ${data.amountInWords ? `.amount-words { font-size: 12px; margin-bottom: 15px; padding: 8px 12px; background: #f0f4f8; border-left: 3px solid #1a5276; }` : ''}
    .bottom-section { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 30px; }
    .qr-area { width: 100px; height: 100px; border: 1px dashed #ccc; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #999; text-align: center; }
    .signature-box { text-align: center; }
    .signature-box .line { border-top: 1px solid #333; margin-top: 50px; padding-top: 5px; font-size: 11px; color: #555; width: 200px; }
    .footer { margin-top: 25px; text-align: center; font-size: 10px; color: #888; border-top: 1px solid #ddd; padding-top: 10px; }
    .footer .computer-generated { font-style: italic; font-weight: bold; color: #666; margin-bottom: 3px; }
    @media print {
      body { padding: 0; }
      .receipt-container { border: none; }
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <div class="header">
      <div class="logo-area">${data.societyLogo ? `<img src="${data.societyLogo}" alt="Logo" style="max-width:70px;max-height:70px;">` : 'LOGO'}</div>
      <div class="header-text">
        <h1>${data.societyName}</h1>
        ${data.societyAddress ? `<p>${data.societyAddress}</p>` : ''}
        ${data.societyPhone ? `<p>Phone: ${data.societyPhone}</p>` : ''}
        ${data.societyEmail ? `<p>Email: ${data.societyEmail}</p>` : ''}
      </div>
      <div class="receipt-badge">Receipt</div>
    </div>

    <div class="receipt-meta">
      <div class="meta-item"><strong>Receipt #:</strong> ${data.receiptNumber}</div>
      <div class="meta-item"><strong>Date:</strong> ${data.date}</div>
      ${data.periodFrom && data.periodTo ? `<div class="meta-item"><strong>Period:</strong> ${data.periodFrom} - ${data.periodTo}</div>` : ''}
    </div>

    <div class="member-info">
      <div class="info-box">
        <h3>Received From</h3>
        <p><strong>${data.memberName}</strong></p>
        ${data.memberId ? `<p>Member ID: ${data.memberId}</p>` : ''}
        ${data.memberCNIC ? `<p>CNIC: ${data.memberCNIC}</p>` : ''}
        ${data.memberPhone ? `<p>Phone: ${data.memberPhone}</p>` : ''}
      </div>
      <div class="info-box">
        <h3>Property Details</h3>
        <p>Plot #: ${data.plotNumber}</p>
        ${data.plotBlock ? `<p>Block: ${data.plotBlock}</p>` : ''}
        ${data.plotSize ? `<p>Size: ${data.plotSize}</p>` : ''}
      </div>
    </div>

    <table class="payment-table">
      <thead>
        <tr>
          <th class="sno-col">#</th>
          <th>Description</th>
          <th class="amount-col">Amount (PKR)</th>
        </tr>
      </thead>
      <tbody>
        ${data.paymentBreakdown.map((item, index) => `
        <tr>
          <td class="sno-col">${index + 1}</td>
          <td>${item.description}</td>
          <td class="amount-col">${item.amount.toLocaleString()}</td>
        </tr>`).join('')}
      </tbody>
    </table>

    <div class="total-section">
      <div class="total-box">
        ${data.subtotal ? `<div class="total-row"><span>Subtotal:</span><span>PKR ${data.subtotal.toLocaleString()}</span></div>` : ''}
        ${data.discount ? `<div class="total-row"><span>Discount:</span><span>- PKR ${data.discount.toLocaleString()}</span></div>` : ''}
        ${data.lateFee ? `<div class="total-row"><span>Late Fee:</span><span>PKR ${data.lateFee.toLocaleString()}</span></div>` : ''}
        <div class="total-row grand"><span>Total:</span><span>PKR ${data.totalAmount.toLocaleString()}</span></div>
      </div>
    </div>

    ${data.amountInWords ? `<div class="amount-words"><strong>Amount in Words:</strong> ${data.amountInWords}</div>` : ''}

    <div class="payment-mode">
      <div class="mode-item"><strong>Payment Mode:</strong> ${data.paymentMode}</div>
      ${data.transactionId ? `<div class="mode-item"><strong>Transaction ID:</strong> ${data.transactionId}</div>` : ''}
      ${data.bankName ? `<div class="mode-item"><strong>Bank:</strong> ${data.bankName}</div>` : ''}
      ${data.chequeNumber ? `<div class="mode-item"><strong>Cheque #:</strong> ${data.chequeNumber}</div>` : ''}
    </div>

    ${data.remarks ? `<div style="font-size:12px;margin-bottom:15px;padding:8px;background:#fafafa;border:1px solid #eee;border-radius:4px;"><strong>Remarks:</strong> ${data.remarks}</div>` : ''}

    <div class="bottom-section">
      <div class="qr-area">${data.qrCodeData ? `<img src="${data.qrCodeData}" alt="QR" style="max-width:90px;max-height:90px;">` : 'QR Code'}</div>
      <div class="signature-box">
        <div class="line">${data.authorizedSignatory || 'Authorized Signature'}</div>
      </div>
    </div>

    <div class="footer">
      <p class="computer-generated">This is a computer-generated receipt and does not require a physical signature.</p>
      <p>Generated on ${new Date().toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })}.</p>
      ${data.receiptNote ? `<p>${data.receiptNote}</p>` : ''}
    </div>
  </div>
</body>
</html>`;
