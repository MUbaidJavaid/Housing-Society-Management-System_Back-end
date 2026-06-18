import { TransferFormData } from '../types/types-pdf-generator';

export const transferFormTemplate = (data: TransferFormData): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Property Transfer Form - ${data.transferNumber || 'NEW'}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; padding: 30px; color: #333; background: #fff; font-size: 13px; line-height: 1.5; }
    .form-container { max-width: 800px; margin: 0 auto; border: 2px solid #1a5276; padding: 30px; }
    .header { text-align: center; border-bottom: 3px solid #1a5276; padding-bottom: 15px; margin-bottom: 20px; }
    .header h1 { font-size: 22px; color: #1a5276; text-transform: uppercase; letter-spacing: 1px; }
    .header h2 { font-size: 16px; color: #555; margin-top: 5px; }
    .header p { font-size: 11px; color: #777; margin-top: 3px; }
    .transfer-info { display: flex; justify-content: space-between; margin-bottom: 20px; padding: 10px; background: #f0f4f8; border-radius: 4px; }
    .transfer-info span { font-size: 12px; font-weight: bold; color: #1a5276; }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 14px; font-weight: bold; color: #1a5276; text-transform: uppercase; border-bottom: 2px solid #1a5276; padding-bottom: 5px; margin-bottom: 12px; }
    .parties { display: flex; gap: 20px; margin-bottom: 20px; }
    .party-box { flex: 1; border: 1px solid #ddd; padding: 15px; border-radius: 4px; }
    .party-box h3 { font-size: 13px; color: #fff; background: #1a5276; padding: 6px 10px; margin: -15px -15px 12px; border-radius: 4px 4px 0 0; text-transform: uppercase; }
    .field { margin-bottom: 8px; }
    .field label { display: block; font-size: 10px; color: #555; text-transform: uppercase; font-weight: bold; margin-bottom: 2px; }
    .field .value { border-bottom: 1px solid #333; padding: 4px 2px; min-height: 22px; font-size: 13px; }
    table.property-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    table.property-table th, table.property-table td { border: 1px solid #ccc; padding: 6px 10px; text-align: left; font-size: 12px; }
    table.property-table th { background: #1a5276; color: #fff; font-size: 11px; text-transform: uppercase; }
    .fee-section { display: flex; gap: 15px; }
    .fee-section .field { flex: 1; }
    .witness-section { display: flex; gap: 20px; margin-top: 15px; }
    .witness-box { flex: 1; border: 1px dashed #ccc; padding: 15px; border-radius: 4px; }
    .witness-box h4 { font-size: 12px; color: #1a5276; margin-bottom: 10px; }
    .signature-area { display: flex; justify-content: space-between; margin-top: 40px; flex-wrap: wrap; gap: 20px; }
    .signature-box { width: 180px; text-align: center; }
    .signature-box .line { border-top: 1px solid #333; margin-top: 50px; padding-top: 5px; font-size: 11px; color: #555; }
    .stamp-area { width: 120px; height: 120px; border: 2px dashed #ccc; display: flex; align-items: center; justify-content: center; margin: 30px auto 0; font-size: 11px; color: #999; text-align: center; }
    .footer { margin-top: 20px; text-align: center; font-size: 10px; color: #888; border-top: 1px solid #ddd; padding-top: 10px; }
    @media print {
      body { padding: 0; }
      .form-container { border: none; }
    }
  </style>
</head>
<body>
  <div class="form-container">
    <div class="header">
      <h1>${data.societyName}</h1>
      <h2>Property Transfer Form</h2>
      ${data.societyAddress ? `<p>${data.societyAddress}</p>` : ''}
      ${data.societyPhone ? `<p>Phone: ${data.societyPhone}</p>` : ''}
    </div>

    <div class="transfer-info">
      <span>Transfer No: ${data.transferNumber || '___________'}</span>
      <span>Date: ${data.transferDate || '___________'}</span>
    </div>

    <div class="parties">
      <div class="party-box">
        <h3>Seller / Transferor</h3>
        <div class="field">
          <label>Full Name</label>
          <div class="value">${data.sellerName || ''}</div>
        </div>
        <div class="field">
          <label>CNIC</label>
          <div class="value">${data.sellerCNIC || ''}</div>
        </div>
        <div class="field">
          <label>Membership No</label>
          <div class="value">${data.sellerMembershipNumber || ''}</div>
        </div>
        <div class="field">
          <label>Phone</label>
          <div class="value">${data.sellerPhone || ''}</div>
        </div>
        <div class="field">
          <label>Address</label>
          <div class="value">${data.sellerAddress || ''}</div>
        </div>
      </div>

      <div class="party-box">
        <h3>Buyer / Transferee</h3>
        <div class="field">
          <label>Full Name</label>
          <div class="value">${data.buyerName || ''}</div>
        </div>
        <div class="field">
          <label>CNIC</label>
          <div class="value">${data.buyerCNIC || ''}</div>
        </div>
        <div class="field">
          <label>Father / Husband Name</label>
          <div class="value">${data.buyerFatherName || ''}</div>
        </div>
        <div class="field">
          <label>Phone</label>
          <div class="value">${data.buyerPhone || ''}</div>
        </div>
        <div class="field">
          <label>Address</label>
          <div class="value">${data.buyerAddress || ''}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Property Details</div>
      <table class="property-table">
        <thead>
          <tr>
            <th>Plot Number</th>
            <th>Block</th>
            <th>Size</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${data.plotNumber || '-'}</td>
            <td>${data.plotBlock || '-'}</td>
            <td>${data.plotSize || '-'}</td>
            <td>${data.plotType || '-'}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="section">
      <div class="section-title">Transfer Fee & Charges</div>
      <div class="fee-section">
        <div class="field">
          <label>Transfer Fee</label>
          <div class="value">PKR ${data.transferFee ? data.transferFee.toLocaleString() : '___________'}</div>
        </div>
        <div class="field">
          <label>Sale Price</label>
          <div class="value">${data.salePrice ? `PKR ${data.salePrice.toLocaleString()}` : '___________'}</div>
        </div>
        <div class="field">
          <label>Outstanding Dues</label>
          <div class="value">${data.outstandingDues ? `PKR ${data.outstandingDues.toLocaleString()}` : 'NIL'}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Witnesses</div>
      <div class="witness-section">
        <div class="witness-box">
          <h4>Witness 1</h4>
          <div class="field">
            <label>Name</label>
            <div class="value">${data.witness1Name || ''}</div>
          </div>
          <div class="field">
            <label>CNIC</label>
            <div class="value">${data.witness1CNIC || ''}</div>
          </div>
          <div class="field">
            <label>Phone</label>
            <div class="value">${data.witness1Phone || ''}</div>
          </div>
        </div>
        <div class="witness-box">
          <h4>Witness 2</h4>
          <div class="field">
            <label>Name</label>
            <div class="value">${data.witness2Name || ''}</div>
          </div>
          <div class="field">
            <label>CNIC</label>
            <div class="value">${data.witness2CNIC || ''}</div>
          </div>
          <div class="field">
            <label>Phone</label>
            <div class="value">${data.witness2Phone || ''}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="signature-area">
      <div class="signature-box">
        <div class="line">Seller Signature</div>
      </div>
      <div class="signature-box">
        <div class="line">Buyer Signature</div>
      </div>
      <div class="signature-box">
        <div class="line">Witness 1</div>
      </div>
      <div class="signature-box">
        <div class="line">Witness 2</div>
      </div>
    </div>

    <div class="stamp-area">
      Society<br>Stamp
    </div>

    <div style="text-align: center; margin-top: 20px;">
      <div class="signature-box" style="display: inline-block;">
        <div class="line">${data.authorizedSignatory || 'Authorized Signatory'}</div>
      </div>
    </div>

    <div class="footer">
      <p>Generated on ${new Date().toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })}.</p>
      <p>This transfer is subject to society rules and regulations. Both parties must appear in person with original documents.</p>
    </div>
  </div>
</body>
</html>`;
