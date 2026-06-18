import { InstallmentScheduleData } from '../types/types-pdf-generator';

export const installmentScheduleTemplate = (data: InstallmentScheduleData): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Installment Schedule - ${data.memberName}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; padding: 30px; color: #333; background: #fff; font-size: 13px; line-height: 1.5; }
    .schedule-container { max-width: 800px; margin: 0 auto; border: 2px solid #1a5276; padding: 30px; }
    .header { text-align: center; border-bottom: 3px solid #1a5276; padding-bottom: 15px; margin-bottom: 20px; }
    .header h1 { font-size: 22px; color: #1a5276; text-transform: uppercase; letter-spacing: 1px; }
    .header h2 { font-size: 16px; color: #555; margin-top: 5px; }
    .header p { font-size: 11px; color: #777; margin-top: 3px; }
    .info-grid { display: flex; gap: 20px; margin-bottom: 20px; }
    .info-box { flex: 1; border: 1px solid #e0e0e0; padding: 12px; border-radius: 4px; }
    .info-box h3 { font-size: 12px; color: #1a5276; text-transform: uppercase; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 8px; }
    .info-box p { font-size: 12px; color: #555; margin-bottom: 3px; }
    .plan-summary { display: flex; gap: 10px; margin-bottom: 20px; }
    .summary-card { flex: 1; background: #f0f4f8; border: 1px solid #d0dae4; border-radius: 4px; padding: 12px; text-align: center; }
    .summary-card .label { font-size: 10px; text-transform: uppercase; color: #777; font-weight: bold; }
    .summary-card .amount { font-size: 18px; font-weight: bold; color: #1a5276; margin-top: 4px; }
    .summary-card.highlight { background: #1a5276; border-color: #1a5276; }
    .summary-card.highlight .label { color: #b0c4de; }
    .summary-card.highlight .amount { color: #fff; }
    .schedule-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .schedule-table th { background: #1a5276; color: #fff; padding: 8px 10px; text-align: left; font-size: 11px; text-transform: uppercase; }
    .schedule-table td { padding: 7px 10px; border-bottom: 1px solid #eee; font-size: 12px; }
    .schedule-table tr:nth-child(even) { background: #f8f9fa; }
    .schedule-table .amount-col { text-align: right; }
    .schedule-table .center-col { text-align: center; }
    .status-paid { color: #27ae60; font-weight: bold; }
    .status-pending { color: #e67e22; font-weight: bold; }
    .status-overdue { color: #e74c3c; font-weight: bold; }
    .status-upcoming { color: #3498db; }
    .total-summary { display: flex; justify-content: flex-end; margin-bottom: 20px; }
    .total-box { width: 320px; border: 2px solid #1a5276; border-radius: 4px; overflow: hidden; }
    .total-box .row { display: flex; justify-content: space-between; padding: 8px 15px; font-size: 13px; border-bottom: 1px solid #eee; }
    .total-box .row:last-child { border-bottom: none; }
    .total-box .row.grand { background: #1a5276; color: #fff; font-weight: bold; font-size: 14px; }
    .total-box .row.paid { color: #27ae60; }
    .total-box .row.remaining { color: #e74c3c; }
    .notes { padding: 10px; background: #fafafa; border: 1px solid #eee; border-radius: 4px; font-size: 11px; color: #666; margin-bottom: 15px; }
    .footer { margin-top: 20px; text-align: center; font-size: 10px; color: #888; border-top: 1px solid #ddd; padding-top: 10px; }
    @media print {
      body { padding: 0; }
      .schedule-container { border: none; }
    }
  </style>
</head>
<body>
  <div class="schedule-container">
    <div class="header">
      <h1>${data.societyName}</h1>
      <h2>Installment Payment Schedule</h2>
      ${data.societyAddress ? `<p>${data.societyAddress}</p>` : ''}
      ${data.societyPhone ? `<p>Phone: ${data.societyPhone}</p>` : ''}
    </div>

    <div class="info-grid">
      <div class="info-box">
        <h3>Member Information</h3>
        <p><strong>${data.memberName}</strong></p>
        ${data.memberId ? `<p>Member ID: ${data.memberId}</p>` : ''}
        ${data.memberCNIC ? `<p>CNIC: ${data.memberCNIC}</p>` : ''}
        ${data.memberPhone ? `<p>Phone: ${data.memberPhone}</p>` : ''}
      </div>
      <div class="info-box">
        <h3>Plot Information</h3>
        <p>Plot #: ${data.plotNumber}</p>
        ${data.plotBlock ? `<p>Block: ${data.plotBlock}</p>` : ''}
        ${data.plotSize ? `<p>Size: ${data.plotSize}</p>` : ''}
        ${data.plotType ? `<p>Type: ${data.plotType}</p>` : ''}
      </div>
    </div>

    <div class="plan-summary">
      <div class="summary-card highlight">
        <div class="label">Total Price</div>
        <div class="amount">PKR ${data.totalPrice.toLocaleString()}</div>
      </div>
      <div class="summary-card">
        <div class="label">Down Payment</div>
        <div class="amount">PKR ${data.downPayment.toLocaleString()}</div>
      </div>
      <div class="summary-card">
        <div class="label">No. of Installments</div>
        <div class="amount">${data.totalInstallments}</div>
      </div>
      <div class="summary-card">
        <div class="label">Monthly Amount</div>
        <div class="amount">PKR ${data.installmentAmount.toLocaleString()}</div>
      </div>
    </div>

    ${data.planStartDate ? `<p style="font-size:12px;margin-bottom:15px;color:#555;"><strong>Plan Start Date:</strong> ${data.planStartDate} ${data.planEndDate ? `&nbsp;&nbsp;|&nbsp;&nbsp;<strong>Plan End Date:</strong> ${data.planEndDate}` : ''}</p>` : ''}

    <table class="schedule-table">
      <thead>
        <tr>
          <th class="center-col">#</th>
          <th>Due Date</th>
          <th class="amount-col">Amount (PKR)</th>
          <th class="center-col">Status</th>
          <th>Paid Date</th>
          <th class="amount-col">Balance (PKR)</th>
        </tr>
      </thead>
      <tbody>
        ${data.schedule.map(item => `
        <tr>
          <td class="center-col">${item.installmentNumber}</td>
          <td>${item.dueDate}</td>
          <td class="amount-col">${item.amount.toLocaleString()}</td>
          <td class="center-col"><span class="status-${item.status.toLowerCase()}">${item.status}</span></td>
          <td>${item.paidDate || '-'}</td>
          <td class="amount-col">${item.balance.toLocaleString()}</td>
        </tr>`).join('')}
      </tbody>
    </table>

    <div class="total-summary">
      <div class="total-box">
        <div class="row grand"><span>Total Amount:</span><span>PKR ${data.totalPrice.toLocaleString()}</span></div>
        <div class="row"><span>Down Payment:</span><span>PKR ${data.downPayment.toLocaleString()}</span></div>
        <div class="row paid"><span>Total Paid:</span><span>PKR ${data.totalPaid.toLocaleString()}</span></div>
        <div class="row remaining"><span>Remaining Balance:</span><span>PKR ${data.remainingBalance.toLocaleString()}</span></div>
      </div>
    </div>

    ${data.notes ? `<div class="notes"><strong>Notes:</strong> ${data.notes}</div>` : ''}

    <div class="footer">
      <p>Generated on ${new Date().toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })}.</p>
      <p>This schedule is subject to the terms and conditions of the installment plan agreement.</p>
    </div>
  </div>
</body>
</html>`;
