import { MembershipFormData } from '../types/types-pdf-generator';

export const membershipFormTemplate = (data: MembershipFormData): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Membership Application Form - ${data.membershipNumber || 'NEW'}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; padding: 30px; color: #333; background: #fff; font-size: 13px; line-height: 1.5; }
    .form-container { max-width: 800px; margin: 0 auto; border: 2px solid #1a5276; padding: 30px; }
    .header { text-align: center; border-bottom: 3px solid #1a5276; padding-bottom: 15px; margin-bottom: 20px; }
    .header .logo-area { width: 80px; height: 80px; border: 1px dashed #ccc; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #999; }
    .header h1 { font-size: 22px; color: #1a5276; text-transform: uppercase; letter-spacing: 1px; }
    .header h2 { font-size: 16px; color: #555; margin-top: 5px; }
    .header p { font-size: 11px; color: #777; margin-top: 3px; }
    .form-number { text-align: right; font-size: 12px; color: #1a5276; font-weight: bold; margin-bottom: 15px; }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 14px; font-weight: bold; color: #1a5276; text-transform: uppercase; border-bottom: 2px solid #1a5276; padding-bottom: 5px; margin-bottom: 12px; }
    .field-row { display: flex; margin-bottom: 8px; gap: 15px; }
    .field { flex: 1; }
    .field label { display: block; font-size: 11px; color: #555; text-transform: uppercase; margin-bottom: 3px; font-weight: bold; }
    .field .value { border-bottom: 1px solid #333; padding: 4px 2px; min-height: 22px; font-size: 13px; }
    .field .value.empty { border-bottom: 1px dashed #aaa; }
    table.plot-details { width: 100%; border-collapse: collapse; margin-top: 8px; }
    table.plot-details th, table.plot-details td { border: 1px solid #ccc; padding: 6px 10px; text-align: left; font-size: 12px; }
    table.plot-details th { background: #1a5276; color: #fff; font-size: 11px; text-transform: uppercase; }
    table.plot-details td { background: #f9f9f9; }
    .nominee-section { background: #f8f9fa; padding: 15px; border: 1px solid #e0e0e0; border-radius: 4px; }
    .terms { margin-top: 15px; }
    .terms h4 { font-size: 12px; color: #1a5276; margin-bottom: 8px; }
    .terms ol { padding-left: 20px; font-size: 11px; color: #555; }
    .terms ol li { margin-bottom: 4px; }
    .signature-area { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 15px; }
    .signature-box { width: 200px; text-align: center; }
    .signature-box .line { border-top: 1px solid #333; margin-top: 50px; padding-top: 5px; font-size: 11px; color: #555; }
    .declaration { margin-top: 20px; padding: 12px; border: 1px solid #ddd; background: #fafafa; font-size: 11px; color: #555; }
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
      <div class="logo-area">${data.societyLogo ? `<img src="${data.societyLogo}" alt="Logo" style="max-width:70px;max-height:70px;">` : 'LOGO'}</div>
      <h1>${data.societyName}</h1>
      <h2>Membership Application Form</h2>
      ${data.societyAddress ? `<p>${data.societyAddress}</p>` : ''}
      ${data.societyPhone ? `<p>Phone: ${data.societyPhone}</p>` : ''}
    </div>

    <div class="form-number">
      <span>Membership No: ${data.membershipNumber || '___________'}</span>
      &nbsp;&nbsp;|&nbsp;&nbsp;
      <span>Date: ${data.applicationDate || '___________'}</span>
    </div>

    <div class="section">
      <div class="section-title">Applicant Information</div>
      <div class="field-row">
        <div class="field">
          <label>Full Name</label>
          <div class="value">${data.applicantName || ''}</div>
        </div>
      </div>
      <div class="field-row">
        <div class="field">
          <label>Father / Husband Name</label>
          <div class="value">${data.fatherHusbandName || ''}</div>
        </div>
      </div>
      <div class="field-row">
        <div class="field">
          <label>CNIC Number</label>
          <div class="value">${data.cnic || ''}</div>
        </div>
        <div class="field">
          <label>Date of Birth</label>
          <div class="value">${data.dateOfBirth || ''}</div>
        </div>
      </div>
      <div class="field-row">
        <div class="field">
          <label>Permanent Address</label>
          <div class="value">${data.address || ''}</div>
        </div>
      </div>
      <div class="field-row">
        <div class="field">
          <label>Phone Number</label>
          <div class="value">${data.phone || ''}</div>
        </div>
        <div class="field">
          <label>Email Address</label>
          <div class="value">${data.email || ''}</div>
        </div>
      </div>
      <div class="field-row">
        <div class="field">
          <label>Occupation</label>
          <div class="value">${data.occupation || ''}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Plot Details</div>
      <table class="plot-details">
        <thead>
          <tr>
            <th>Plot Number</th>
            <th>Block</th>
            <th>Size</th>
            <th>Type</th>
            <th>Category</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${data.plotNumber || '-'}</td>
            <td>${data.plotBlock || '-'}</td>
            <td>${data.plotSize || '-'}</td>
            <td>${data.plotType || '-'}</td>
            <td>${data.plotCategory || '-'}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="section">
      <div class="section-title">Nominee Information</div>
      <div class="nominee-section">
        <div class="field-row">
          <div class="field">
            <label>Nominee Name</label>
            <div class="value">${data.nomineeName || ''}</div>
          </div>
          <div class="field">
            <label>Relationship</label>
            <div class="value">${data.nomineeRelation || ''}</div>
          </div>
        </div>
        <div class="field-row">
          <div class="field">
            <label>Nominee CNIC</label>
            <div class="value">${data.nomineeCNIC || ''}</div>
          </div>
          <div class="field">
            <label>Nominee Phone</label>
            <div class="value">${data.nomineePhone || ''}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="declaration">
        <strong>Declaration:</strong> I hereby declare that the information provided above is true and correct to the best of my knowledge. I agree to abide by the rules, regulations, and bylaws of <strong>${data.societyName}</strong>. I understand that any false information may result in cancellation of my membership.
      </div>
    </div>

    ${data.terms && data.terms.length > 0 ? `
    <div class="section terms">
      <h4>Terms & Conditions</h4>
      <ol>
        ${data.terms.map(term => `<li>${term}</li>`).join('')}
      </ol>
    </div>` : ''}

    <div class="signature-area">
      <div class="signature-box">
        <div class="line">Applicant Signature</div>
      </div>
      <div class="signature-box">
        <div class="line">Witness Signature</div>
      </div>
      <div class="signature-box">
        <div class="line">${data.authorizedSignatory || 'Authorized Signatory'}</div>
      </div>
    </div>

    <div class="footer">
      <p>This form was generated on ${new Date().toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })}.</p>
      <p>For office use only. All fields must be completed before submission.</p>
    </div>
  </div>
</body>
</html>`;
