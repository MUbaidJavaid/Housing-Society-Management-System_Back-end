import { InvoiceData } from '../types/types-pdf-generator';

export const invoiceTemplate = (data: InvoiceData): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice - ${data.invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; padding: 40px; color: #333; background: #fff; }
    .invoice { max-width: 800px; margin: 0 auto; border: 1px solid #ddd; padding: 30px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1a5276; padding-bottom: 20px; margin-bottom: 20px; }
    .header .company { flex: 1; }
    .header .company h1 { font-size: 22px; color: #1a5276; margin-bottom: 5px; }
    .header .company p { font-size: 12px; color: #777; }
    .header .invoice-info { text-align: right; }
    .header .invoice-info h2 { font-size: 28px; color: #1a5276; text-transform: uppercase; }
    .header .invoice-info p { font-size: 13px; color: #555; margin-top: 5px; }
    .billing { display: flex; justify-content: space-between; margin-bottom: 25px; }
    .billing .section { width: 48%; }
    .billing .section h3 { font-size: 13px; color: #1a5276; text-transform: uppercase; margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
    .billing .section p { font-size: 13px; color: #555; line-height: 1.6; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .items-table th { background: #1a5276; color: #fff; padding: 10px 12px; text-align: left; font-size: 13px; }
    .items-table td { padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 13px; }
    .items-table tr:nth-child(even) { background: #f8f9fa; }
    .items-table .amount { text-align: right; }
    .totals { width: 300px; margin-left: auto; margin-bottom: 25px; }
    .totals table { width: 100%; border-collapse: collapse; }
    .totals td { padding: 8px 12px; font-size: 14px; }
    .totals td:last-child { text-align: right; }
    .totals .total-row { border-top: 2px solid #1a5276; font-weight: bold; font-size: 16px; color: #1a5276; }
    .notes { margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 4px; font-size: 12px; color: #666; }
    .notes h4 { margin-bottom: 5px; color: #555; }
    .footer { margin-top: 25px; text-align: center; font-size: 11px; color: #888; font-style: italic; }
    @media print { body { padding: 0; } .invoice { border: none; } }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div class="company">
        <h1>${data.societyName}</h1>
        ${data.societyAddress ? `<p>${data.societyAddress}</p>` : ''}
        ${data.societyPhone ? `<p>Phone: ${data.societyPhone}</p>` : ''}
      </div>
      <div class="invoice-info">
        <h2>Invoice</h2>
        <p><strong>Invoice #:</strong> ${data.invoiceNumber}</p>
        <p><strong>Date:</strong> ${data.invoiceDate}</p>
        <p><strong>Due Date:</strong> ${data.dueDate}</p>
      </div>
    </div>

    <div class="billing">
      <div class="section">
        <h3>Bill To</h3>
        <p><strong>${data.memberName}</strong></p>
        <p>Member ID: ${data.memberId}</p>
        ${data.memberCNIC ? `<p>CNIC: ${data.memberCNIC}</p>` : ''}
        ${data.memberAddress ? `<p>${data.memberAddress}</p>` : ''}
        ${data.memberPhone ? `<p>Phone: ${data.memberPhone}</p>` : ''}
      </div>
      <div class="section">
        <h3>Property Details</h3>
        <p>Plot: ${data.plotNumber}</p>
        ${data.plotBlock ? `<p>Block: ${data.plotBlock}</p>` : ''}
        ${data.plotSize ? `<p>Size: ${data.plotSize}</p>` : ''}
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Description</th>
          <th>Qty</th>
          <th>Unit Price</th>
          <th class="amount">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${data.lineItems
          .map(
            (item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${item.description}</td>
          <td>${item.quantity}</td>
          <td>PKR ${item.unitPrice.toLocaleString()}</td>
          <td class="amount">PKR ${item.amount.toLocaleString()}</td>
        </tr>`
          )
          .join('')}
      </tbody>
    </table>

    <div class="totals">
      <table>
        <tr>
          <td>Subtotal:</td>
          <td>PKR ${data.subtotal.toLocaleString()}</td>
        </tr>
        ${data.taxRate !== undefined ? `<tr><td>Tax (${data.taxRate}%):</td><td>PKR ${(data.tax || 0).toLocaleString()}</td></tr>` : ''}
        ${data.discount ? `<tr><td>Discount:</td><td>- PKR ${data.discount.toLocaleString()}</td></tr>` : ''}
        <tr class="total-row">
          <td>Total:</td>
          <td>PKR ${data.totalAmount.toLocaleString()}</td>
        </tr>
      </table>
    </div>

    ${data.amountInWords ? `<p style="font-size:13px;margin-bottom:15px;"><strong>Amount in Words:</strong> ${data.amountInWords}</p>` : ''}

    ${data.paymentInstructions ? `<div class="notes"><h4>Payment Instructions</h4><p>${data.paymentInstructions}</p></div>` : ''}
    ${data.notes ? `<div class="notes"><h4>Notes</h4><p>${data.notes}</p></div>` : ''}

    <div class="footer">
      <p>This is a computer-generated invoice and does not require a signature.</p>
    </div>
  </div>
</body>
</html>`;
