import { AllotmentData } from '../types/types-pdf-generator';

export const allotmentLetterTemplate = (data: AllotmentData): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Allotment Letter - ${data.letterNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Times New Roman', Times, serif; padding: 40px; color: #333; background: #fff; }
    .letter { max-width: 800px; margin: 0 auto; border: 2px solid #333; padding: 40px; }
    .header { text-align: center; border-bottom: 3px solid #1a5276; padding-bottom: 20px; margin-bottom: 25px; }
    .header h1 { font-size: 24px; color: #1a5276; text-transform: uppercase; letter-spacing: 2px; }
    .header h2 { font-size: 18px; color: #2c3e50; margin-top: 10px; font-weight: normal; }
    ${data.societyAddress ? `.header p { font-size: 12px; color: #777; margin-top: 5px; }` : ''}
    .letter-meta { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 14px; }
    .letter-meta strong { color: #1a5276; }
    .recipient { margin-bottom: 20px; font-size: 14px; line-height: 1.8; }
    .recipient strong { display: block; font-size: 15px; }
    .subject { text-align: center; font-size: 16px; font-weight: bold; color: #1a5276; text-decoration: underline; margin: 20px 0; text-transform: uppercase; }
    .body-text { font-size: 14px; line-height: 2; text-align: justify; margin: 15px 0; }
    .body-text .highlight { font-weight: bold; color: #1a5276; }
    .details-table { width: 90%; margin: 20px auto; border-collapse: collapse; border: 1px solid #ddd; }
    .details-table th { background: #1a5276; color: #fff; padding: 8px 12px; text-align: left; font-size: 13px; }
    .details-table td { padding: 8px 12px; font-size: 13px; border-bottom: 1px solid #eee; }
    .details-table td:first-child { font-weight: bold; color: #555; width: 45%; background: #f8f9fa; }
    .financial-table { width: 90%; margin: 20px auto; border-collapse: collapse; border: 1px solid #ddd; }
    .financial-table th { background: #2c3e50; color: #fff; padding: 8px 12px; text-align: left; font-size: 13px; }
    .financial-table td { padding: 8px 12px; font-size: 13px; border-bottom: 1px solid #eee; }
    .financial-table td:first-child { font-weight: bold; color: #555; width: 45%; background: #f8f9fa; }
    .financial-table .total-row { background: #e8f4f8 !important; font-weight: bold; }
    .financial-table .total-row td { color: #1a5276; font-size: 14px; }
    .terms { margin: 20px 0; padding: 15px; background: #f8f9fa; border-left: 3px solid #1a5276; }
    .terms h4 { font-size: 14px; color: #1a5276; margin-bottom: 8px; }
    .terms ol { margin-left: 20px; font-size: 12px; line-height: 1.8; color: #555; }
    .congratulations { text-align: center; margin: 20px 0; padding: 15px; background: #e8f8f5; border-radius: 4px; font-size: 14px; color: #1a5276; font-weight: bold; }
    .signatures { display: flex; justify-content: space-between; margin-top: 60px; padding: 0 20px; }
    .signatures div { text-align: center; width: 200px; }
    .signatures .line { border-top: 1px solid #333; padding-top: 8px; font-size: 13px; }
    .signatures .designation { font-size: 11px; color: #777; }
    .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #aaa; border-top: 1px solid #eee; padding-top: 10px; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="letter">
    <div class="header">
      <h1>${data.societyName}</h1>
      <h2>Plot Allotment Letter</h2>
      ${data.societyAddress ? `<p>${data.societyAddress}</p>` : ''}
    </div>

    <div class="letter-meta">
      <div><strong>Letter No:</strong> ${data.letterNumber}</div>
      <div><strong>Date:</strong> ${data.letterDate}</div>
    </div>

    <div class="recipient">
      <strong>${data.memberName}</strong>
      S/o / D/o / W/o ${data.fatherName}<br />
      CNIC: ${data.memberCNIC}<br />
      ${data.memberAddress}<br />
      ${data.memberPhone ? `Phone: ${data.memberPhone}` : ''}
    </div>

    <div class="subject">Subject: Allotment of Plot No. ${data.plotNumber}, Block ${data.plotBlock}</div>

    <div class="body-text">
      <p>Dear <span class="highlight">${data.memberName}</span>,</p>
      <br />
      <p>
        We are pleased to inform you that the management of <span class="highlight">${data.societyName}</span>
        has allotted the following plot in your name. The details of the allotment are as follows:
      </p>
    </div>

    <table class="details-table">
      <tr><th colspan="2">Property Details</th></tr>
      <tr><td>Plot Number:</td><td>${data.plotNumber}</td></tr>
      <tr><td>Block:</td><td>${data.plotBlock}</td></tr>
      <tr><td>Plot Size:</td><td>${data.plotSize}</td></tr>
      <tr><td>Plot Type:</td><td>${data.plotType}</td></tr>
      ${data.plotCategory ? `<tr><td>Category:</td><td>${data.plotCategory}</td></tr>` : ''}
      <tr><td>Allotment Date:</td><td>${data.allotmentDate}</td></tr>
      ${data.possessionDate ? `<tr><td>Expected Possession:</td><td>${data.possessionDate}</td></tr>` : ''}
    </table>

    <table class="financial-table">
      <tr><th colspan="2">Financial Summary</th></tr>
      <tr><td>Total Price:</td><td>PKR ${data.totalPrice.toLocaleString()}</td></tr>
      <tr><td>Amount Paid:</td><td>PKR ${data.paidAmount.toLocaleString()}</td></tr>
      <tr class="total-row"><td>Remaining Balance:</td><td>PKR ${data.remainingAmount.toLocaleString()}</td></tr>
      ${data.paymentPlan ? `<tr><td>Payment Plan:</td><td>${data.paymentPlan}</td></tr>` : ''}
    </table>

    ${
      data.terms && data.terms.length > 0
        ? `
    <div class="terms">
      <h4>Terms & Conditions:</h4>
      <ol>
        ${data.terms.map(t => `<li>${t}</li>`).join('')}
      </ol>
    </div>`
        : `
    <div class="terms">
      <h4>Terms & Conditions:</h4>
      <ol>
        <li>This allotment letter is non-transferable without prior written consent from the management.</li>
        <li>All remaining dues must be paid as per the agreed payment schedule.</li>
        <li>Failure to pay dues on time may result in cancellation of allotment with applicable penalties.</li>
        <li>The society reserves the right to make changes in the layout plan as per regulatory requirements.</li>
        <li>Possession will be handed over only after full payment of all dues and development charges.</li>
        <li>This allotment is subject to all rules and regulations of ${data.societyName}.</li>
      </ol>
    </div>`
    }

    <div class="congratulations">
      Congratulations on your new plot! Welcome to ${data.societyName}.
    </div>

    <div class="signatures">
      <div>
        <div class="line">Allottee Signature</div>
      </div>
      <div>
        <div class="line">${data.authorizedSignatory || 'Authorized Signatory'}</div>
        <div class="designation">${data.signatoryDesignation || 'Chairman / Director'}</div>
      </div>
    </div>

    <div class="footer">
      <p>This allotment letter is subject to verification and the terms mentioned above. Please keep this document safe for future reference.</p>
    </div>
  </div>
</body>
</html>`;
