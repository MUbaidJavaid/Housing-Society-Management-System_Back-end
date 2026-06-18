import { NOCData } from '../types/types-pdf-generator';

export const nocTemplate = (data: NOCData): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NOC - ${data.nocNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Times New Roman', Times, serif; padding: 40px; color: #333; background: #fff; }
    .noc { max-width: 800px; margin: 0 auto; border: 2px solid #333; padding: 40px; }
    .header { text-align: center; border-bottom: 2px solid #1a5276; padding-bottom: 20px; margin-bottom: 25px; }
    .header h1 { font-size: 24px; color: #1a5276; margin-bottom: 5px; text-transform: uppercase; }
    .header h2 { font-size: 20px; color: #c0392b; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin-top: 10px; }
    ${data.societyAddress ? `.header p { font-size: 12px; color: #777; margin-top: 5px; }` : ''}
    .noc-meta { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 14px; }
    .noc-meta strong { color: #1a5276; }
    .body-text { font-size: 15px; line-height: 2; text-align: justify; margin: 20px 0; }
    .body-text .highlight { font-weight: bold; color: #1a5276; }
    .details-table { width: 80%; margin: 20px auto; border-collapse: collapse; }
    .details-table td { padding: 8px 15px; font-size: 14px; border-bottom: 1px dotted #ccc; }
    .details-table td:first-child { font-weight: bold; color: #555; width: 40%; }
    .conditions { margin: 20px 0; padding: 15px; background: #f8f9fa; border-left: 3px solid #1a5276; }
    .conditions h4 { font-size: 14px; color: #1a5276; margin-bottom: 8px; }
    .conditions ol { margin-left: 20px; font-size: 13px; line-height: 1.8; color: #555; }
    .signatures { display: flex; justify-content: space-between; margin-top: 60px; padding: 0 30px; }
    .signatures div { text-align: center; width: 200px; }
    .signatures .line { border-top: 1px solid #333; padding-top: 8px; font-size: 13px; }
    .signatures .designation { font-size: 11px; color: #777; }
    .stamp-area { text-align: center; margin-top: 30px; }
    .stamp-area .stamp { display: inline-block; width: 120px; height: 120px; border: 2px dashed #ccc; border-radius: 50%; line-height: 120px; font-size: 11px; color: #ccc; }
    .footer { margin-top: 20px; text-align: center; font-size: 10px; color: #aaa; border-top: 1px solid #eee; padding-top: 10px; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="noc">
    <div class="header">
      <h1>${data.societyName}</h1>
      ${data.societyAddress ? `<p>${data.societyAddress}</p>` : ''}
      <h2>No Objection Certificate</h2>
    </div>

    <div class="noc-meta">
      <div><strong>NOC No:</strong> ${data.nocNumber}</div>
      <div><strong>Date:</strong> ${data.nocDate}</div>
    </div>

    <div class="body-text">
      <p>To Whom It May Concern,</p>
      <br />
      <p>
        This is to certify that <span class="highlight">${data.memberName}</span>,
        S/o / D/o / W/o <span class="highlight">${data.fatherName}</span>,
        bearing CNIC No. <span class="highlight">${data.memberCNIC}</span>,
        is a bonafide member of <span class="highlight">${data.societyName}</span>
        and is the allottee of the following property:
      </p>
    </div>

    <table class="details-table">
      <tr><td>Plot Number:</td><td>${data.plotNumber}</td></tr>
      <tr><td>Block:</td><td>${data.plotBlock}</td></tr>
      <tr><td>Plot Size:</td><td>${data.plotSize}</td></tr>
      <tr><td>Purpose:</td><td>${data.purpose}</td></tr>
      ${data.validUntil ? `<tr><td>Valid Until:</td><td>${data.validUntil}</td></tr>` : ''}
    </table>

    <div class="body-text">
      <p>
        The management of <span class="highlight">${data.societyName}</span> has no objection
        regarding the above-mentioned purpose. All dues and charges pertaining to the above property
        have been cleared as of the date of issuance of this certificate.
      </p>
    </div>

    ${
      data.conditions && data.conditions.length > 0
        ? `
    <div class="conditions">
      <h4>Terms & Conditions:</h4>
      <ol>
        ${data.conditions.map(c => `<li>${c}</li>`).join('')}
      </ol>
    </div>`
        : ''
    }

    <div class="signatures">
      <div>
        <div class="line">Member Signature</div>
      </div>
      <div>
        <div class="line">${data.authorizedSignatory || 'Authorized Signatory'}</div>
        <div class="designation">${data.signatoryDesignation || 'Chairman / Secretary'}</div>
      </div>
    </div>

    <div class="stamp-area">
      <div class="stamp">Official Stamp</div>
    </div>

    <div class="footer">
      <p>This NOC is issued for the specific purpose mentioned above and cannot be used for any other purpose.</p>
    </div>
  </div>
</body>
</html>`;
