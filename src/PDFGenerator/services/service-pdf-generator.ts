import { AppError } from '../../middleware/error.middleware';
import { receiptTemplate } from '../templates/receipt-template';
import { invoiceTemplate } from '../templates/invoice-template';
import { certificateTemplate } from '../templates/certificate-template';
import { nocTemplate } from '../templates/noc-template';
import { allotmentLetterTemplate } from '../templates/allotment-letter-template';
import { membershipFormTemplate } from '../templates/membership-form-template';
import { transferFormTemplate } from '../templates/transfer-form-template';
import { paymentReceiptTemplate } from '../templates/payment-receipt-template';
import { installmentScheduleTemplate } from '../templates/installment-schedule-template';
import {
  AllotmentData,
  CertificateData,
  InstallmentScheduleData,
  InvoiceData,
  MembershipFormData,
  NOCData,
  PaymentReceiptData,
  ReceiptData,
  TemplateInfo,
  TemplateName,
  TransferFormData,
} from '../types/types-pdf-generator';

/**
 * Map of template names to their render functions
 */
const templateMap: Record<TemplateName, (data: any) => string> = {
  receipt: receiptTemplate,
  invoice: invoiceTemplate,
  certificate: certificateTemplate,
  noc: nocTemplate,
  'allotment-letter': allotmentLetterTemplate,
  'membership-form': membershipFormTemplate,
  'transfer-form': transferFormTemplate,
  'payment-receipt': paymentReceiptTemplate,
  'installment-schedule': installmentScheduleTemplate,
};

/**
 * Available template metadata
 */
const templateInfoList: TemplateInfo[] = [
  {
    name: 'receipt',
    label: 'Payment Receipt',
    description: 'Generate a payment receipt for a member transaction',
    requiredFields: ['societyName', 'receiptNumber', 'memberName', 'memberId', 'plotNumber', 'amount', 'date', 'paymentMode'],
  },
  {
    name: 'invoice',
    label: 'Bill Invoice',
    description: 'Generate a detailed invoice with line items',
    requiredFields: ['societyName', 'invoiceNumber', 'invoiceDate', 'dueDate', 'memberName', 'memberId', 'plotNumber', 'lineItems', 'subtotal', 'totalAmount'],
  },
  {
    name: 'certificate',
    label: 'PLRA Certificate',
    description: 'Generate a PLRA registration certificate for property ownership',
    requiredFields: ['societyName', 'certificateNumber', 'certificateDate', 'memberName', 'memberCNIC', 'fatherName', 'plotNumber', 'plotBlock', 'plotSize', 'plotType', 'registrationDate'],
  },
  {
    name: 'noc',
    label: 'No Objection Certificate',
    description: 'Generate a No Objection Certificate (NOC) for a member',
    requiredFields: ['societyName', 'nocNumber', 'nocDate', 'memberName', 'memberCNIC', 'fatherName', 'plotNumber', 'plotBlock', 'plotSize', 'purpose'],
  },
  {
    name: 'allotment-letter',
    label: 'Plot Allotment Letter',
    description: 'Generate a plot allotment letter for a new member',
    requiredFields: ['societyName', 'letterNumber', 'letterDate', 'memberName', 'memberCNIC', 'fatherName', 'memberAddress', 'plotNumber', 'plotBlock', 'plotSize', 'plotType', 'totalPrice', 'paidAmount', 'remainingAmount', 'allotmentDate'],
  },
  {
    name: 'membership-form',
    label: 'Membership Application Form',
    description: 'Generate a membership application form for new applicants',
    requiredFields: ['societyName', 'applicantName', 'fatherHusbandName', 'cnic', 'address', 'phone'],
  },
  {
    name: 'transfer-form',
    label: 'Property Transfer Form',
    description: 'Generate a property transfer form between seller and buyer',
    requiredFields: ['societyName', 'sellerName', 'sellerCNIC', 'buyerName', 'buyerCNIC', 'plotNumber'],
  },
  {
    name: 'payment-receipt',
    label: 'Payment Receipt',
    description: 'Generate an enhanced payment receipt with breakdown and QR placeholder',
    requiredFields: ['societyName', 'receiptNumber', 'date', 'memberName', 'plotNumber', 'paymentBreakdown', 'totalAmount', 'paymentMode'],
  },
  {
    name: 'installment-schedule',
    label: 'Installment Payment Schedule',
    description: 'Generate an installment plan schedule with payment tracking',
    requiredFields: ['societyName', 'memberName', 'plotNumber', 'totalPrice', 'downPayment', 'totalInstallments', 'installmentAmount', 'schedule', 'totalPaid', 'remainingBalance'],
  },
];

export const pdfGeneratorService = {
  /**
   * Generate PDF (HTML) from a template name and data
   * Returns the rendered HTML string. Client-side or puppeteer can convert to actual PDF.
   */
  generatePDF(templateName: TemplateName, data: any): string {
    const renderFn = templateMap[templateName];
    if (!renderFn) {
      throw new AppError(400, `Unknown template: ${templateName}. Available: ${Object.keys(templateMap).join(', ')}`);
    }

    try {
      return renderFn(data);
    } catch (error: any) {
      throw new AppError(500, `Failed to render template "${templateName}": ${error.message}`);
    }
  },

  /**
   * Generate a payment receipt
   */
  generateReceipt(data: ReceiptData): string {
    return pdfGeneratorService.generatePDF('receipt', data);
  },

  /**
   * Generate a bill invoice with line items
   */
  generateInvoice(data: InvoiceData): string {
    return pdfGeneratorService.generatePDF('invoice', data);
  },

  /**
   * Generate a PLRA certificate
   */
  generateCertificate(data: CertificateData): string {
    return pdfGeneratorService.generatePDF('certificate', data);
  },

  /**
   * Generate a No Objection Certificate
   */
  generateNOC(data: NOCData): string {
    return pdfGeneratorService.generatePDF('noc', data);
  },

  /**
   * Generate a plot allotment letter
   */
  generateAllotmentLetter(data: AllotmentData): string {
    return pdfGeneratorService.generatePDF('allotment-letter', data);
  },

  /**
   * Generate a membership application form
   */
  generateMembershipForm(data: MembershipFormData): string {
    return pdfGeneratorService.generatePDF('membership-form', data);
  },

  /**
   * Generate a property transfer form
   */
  generateTransferForm(data: TransferFormData): string {
    return pdfGeneratorService.generatePDF('transfer-form', data);
  },

  /**
   * Generate an enhanced payment receipt
   */
  generatePaymentReceipt(data: PaymentReceiptData): string {
    return pdfGeneratorService.generatePDF('payment-receipt', data);
  },

  /**
   * Generate an installment schedule
   */
  generateInstallmentSchedule(data: InstallmentScheduleData): string {
    return pdfGeneratorService.generatePDF('installment-schedule', data);
  },

  /**
   * Generate HTML and upload to Cloudinary
   * Returns the Cloudinary URL if upload is configured, otherwise returns the HTML string
   */
  async generateAndUpload(
    templateName: TemplateName,
    data: any,
    _societyId?: string
  ): Promise<{ html: string; url?: string }> {
    const html = pdfGeneratorService.generatePDF(templateName, data);

    // Attempt to upload to Cloudinary if configured
    const cloudinaryUrl = process.env.CLOUDINARY_URL;
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (cloudinaryUrl || (cloudName && apiKey && apiSecret)) {
      try {
        // Dynamic import to avoid requiring cloudinary if not used
        const cloudinary = await import('cloudinary');

        if (cloudinaryUrl) {
          // cloudinary auto-configures from CLOUDINARY_URL
        } else {
          cloudinary.v2.config({
            cloud_name: cloudName,
            api_key: apiKey,
            api_secret: apiSecret,
          });
        }

        // Upload HTML as a raw file
        const uploadResult = await cloudinary.v2.uploader.upload(
          `data:text/html;base64,${Buffer.from(html).toString('base64')}`,
          {
            resource_type: 'raw',
            folder: `hsms/documents/${templateName}`,
            public_id: `${templateName}-${Date.now()}`,
            format: 'html',
          }
        );

        return { html, url: uploadResult.secure_url };
      } catch (error: any) {
        // If Cloudinary upload fails, still return the HTML
        console.warn(`Cloudinary upload failed: ${error.message}. Returning HTML only.`);
        return { html };
      }
    }

    return { html };
  },

  /**
   * Get list of available templates with their metadata
   */
  getTemplates(): TemplateInfo[] {
    return templateInfoList;
  },
};
