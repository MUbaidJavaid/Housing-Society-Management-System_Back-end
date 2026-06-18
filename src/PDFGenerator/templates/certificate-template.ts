import { CertificateData } from '../types/types-pdf-generator';

export const certificateTemplate = (data: CertificateData): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PLRA Certificate - ${data.certificateNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Times New Roman', Times, serif; padding: 40px; color: #333; background: #fff; }
    .certificate { max-width: 800px; margin: 0 auto; border: 3px double #1a5276; padding: 40px; position: relative; }
    .certificate::before { content: ''; position: absolute; top: 8px; left: 8px; right: 8px; bottom: 8px; border: 1px solid #1a5276; pointer-events: none; }
    .header { text-align: center; margin-bottom: 30px; }
    .header h1 { font-size: 26px; color: #1a5276; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 2px; }
    .header h2 { font-size: 20px; color: #2c3e50; font-weight: normal; margin-bottom: 5px; }
    .header h3 { font-size: 16px; color: #c0392b; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
    ${data.societyAddress ? `.header p.address { font-size: 12px; color: #777; margin-top: 5px; }` : ''}
    .cert-number { text-align: center; margin: 20px 0; font-size: 14px; color: #555; }
    .cert-number strong { color: #1a5276; }
    .body-text { font-size: 15px; line-height: 2; text-align: justify; margin: 20px 0; }
    .body-text .highlight { font-weight: bold; color: #1a5276; text-decoration: underline; }
    .details-table { width: 80%; margin: 20px auto; border-collapse: collapse; }
    .details-table td { padding: 8px 15px; font-size: 14px; border-bottom: 1px dotted #ccc; }
    .details-table td:first-child { font-weight: bold; color: #555; width: 40%; }
    .qr-placeholder { text-align: center; margin: 20px 0; }
    .qr-placeholder .qr-box { display: inline-block; width: 100px; height: 100px; border: 1px solid #ccc; background: #f8f9fa; line-height: 100px; font-size: 11px; color: #aaa; }
    .signatures { display: flex; justify-content: space-between; margin-top: 60px; padding: 0 30px; }
    .signatures div { text-align: center; width: 200px; }
    .signatures .line { border-top: 1px solid #333; padding-top: 8px; font-size: 13px; }
    .signatures .designation { font-size: 11px; color: #777; }
    .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #aaa; border-top: 1px solid #eee; padding-top: 10px; }
    @media print { body { padding: 0; } .certificate::before { border-color: #1a5276; } }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="header">
      <h1>${data.societyName}</h1>
      <h2>Punjab Land Records Authority</h2>
      <h3>Registration Certificate</h3>
      ${data.societyAddress ? `<p class="address">${data.societyAddress}</p>` : ''}
    </div>

    <div class="cert-number">
      <strong>Certificate No:</strong> ${data.certificateNumber} &nbsp;&nbsp;|&nbsp;&nbsp;
      <strong>Date:</strong> ${data.certificateDate}
    </div>

    <div class="body-text">
      This is to certify that <span class="highlight">${data.memberName}</span>,
      S/o / D/o / W/o <span class="highlight">${data.fatherName}</span>,
      holding CNIC No. <span class="highlight">${data.memberCNIC}</span>,
      is the registered and rightful owner of <span class="highlight">Plot No. ${data.plotNumber}</span>,
      Block <span class="highlight">${data.plotBlock}</span>,
      measuring <span class="highlight">${data.plotSize}</span>,
      of type <span class="highlight">${data.plotType}</span>,
      in <span class="highlight">${data.societyName}</span>.
    </div>

    <table class="details-table">
      <tr><td>Plot Number:</td><td>${data.plotNumber}</td></tr>
      <tr><td>Block:</td><td>${data.plotBlock}</td></tr>
      <tr><td>Plot Size:</td><td>${data.plotSize}</td></tr>
      <tr><td>Plot Type:</td><td>${data.plotType}</td></tr>
      <tr><td>Registration Date:</td><td>${data.registrationDate}</td></tr>
      ${data.plraRegistrationNo ? `<tr><td>PLRA Registration No:</td><td>${data.plraRegistrationNo}</td></tr>` : ''}
    </table>

    <div class="qr-placeholder">
      ${data.qrCodeData
        ? `<img src="${data.qrCodeData}" alt="QR Code" width="100" height="100" />`
        : `<div class="qr-box">QR Code</div>`}
      <p style="font-size:10px;color:#aaa;margin-top:5px;">Scan to verify</p>
    </div>

    <div class="signatures">
      <div>
        <div class="line">Member Signature</div>
      </div>
      <div>
        <div class="line">${data.authorizedSignatory || 'Authorized Signatory'}</div>
        <div class="designation">${data.signatoryDesignation || 'Chairman / Secretary'}</div>
      </div>
    </div>

    <div class="footer">
      <p>This certificate is issued by ${data.societyName} and is subject to verification through PLRA records.</p>
    </div>
  </div>
</body>
</html>`;
