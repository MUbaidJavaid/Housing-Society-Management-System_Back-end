export interface ReceiptData {
  societyName: string;
  societyAddress?: string;
  societyPhone?: string;
  societyLogo?: string;
  receiptNumber: string;
  memberName: string;
  memberId: string;
  memberCNIC?: string;
  plotNumber: string;
  plotBlock?: string;
  plotSize?: string;
  amount: number;
  amountInWords?: string;
  date: string;
  paymentMode: string;
  transactionId?: string;
  description?: string;
  receivedBy?: string;
  remarks?: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface InvoiceData {
  societyName: string;
  societyAddress?: string;
  societyPhone?: string;
  societyLogo?: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  memberName: string;
  memberId: string;
  memberAddress?: string;
  memberPhone?: string;
  memberCNIC?: string;
  plotNumber: string;
  plotBlock?: string;
  plotSize?: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  tax?: number;
  taxRate?: number;
  discount?: number;
  totalAmount: number;
  amountInWords?: string;
  paymentInstructions?: string;
  notes?: string;
}

export interface CertificateData {
  societyName: string;
  societyAddress?: string;
  societyLogo?: string;
  certificateNumber: string;
  certificateDate: string;
  memberName: string;
  memberCNIC: string;
  fatherName: string;
  plotNumber: string;
  plotBlock: string;
  plotSize: string;
  plotType: string;
  registrationDate: string;
  plraRegistrationNo?: string;
  qrCodeData?: string;
  authorizedSignatory?: string;
  signatoryDesignation?: string;
}

export interface NOCData {
  societyName: string;
  societyAddress?: string;
  societyLogo?: string;
  nocNumber: string;
  nocDate: string;
  memberName: string;
  memberCNIC: string;
  fatherName: string;
  plotNumber: string;
  plotBlock: string;
  plotSize: string;
  purpose: string;
  validUntil?: string;
  conditions?: string[];
  authorizedSignatory?: string;
  signatoryDesignation?: string;
}

export interface AllotmentData {
  societyName: string;
  societyAddress?: string;
  societyLogo?: string;
  letterNumber: string;
  letterDate: string;
  memberName: string;
  memberCNIC: string;
  fatherName: string;
  memberAddress: string;
  memberPhone?: string;
  plotNumber: string;
  plotBlock: string;
  plotSize: string;
  plotType: string;
  plotCategory?: string;
  totalPrice: number;
  paidAmount: number;
  remainingAmount: number;
  paymentPlan?: string;
  allotmentDate: string;
  possessionDate?: string;
  terms?: string[];
  authorizedSignatory?: string;
  signatoryDesignation?: string;
}

export interface MembershipFormData {
  societyName: string;
  societyAddress?: string;
  societyPhone?: string;
  societyLogo?: string;
  membershipNumber?: string;
  applicationDate?: string;
  applicantName: string;
  fatherHusbandName: string;
  cnic: string;
  dateOfBirth?: string;
  address: string;
  phone: string;
  email?: string;
  occupation?: string;
  plotNumber?: string;
  plotBlock?: string;
  plotSize?: string;
  plotType?: string;
  plotCategory?: string;
  nomineeName?: string;
  nomineeRelation?: string;
  nomineeCNIC?: string;
  nomineePhone?: string;
  terms?: string[];
  authorizedSignatory?: string;
}

export interface TransferFormData {
  societyName: string;
  societyAddress?: string;
  societyPhone?: string;
  transferNumber?: string;
  transferDate?: string;
  sellerName: string;
  sellerCNIC: string;
  sellerMembershipNumber?: string;
  sellerPhone?: string;
  sellerAddress?: string;
  buyerName: string;
  buyerCNIC: string;
  buyerFatherName?: string;
  buyerPhone?: string;
  buyerAddress?: string;
  plotNumber: string;
  plotBlock?: string;
  plotSize?: string;
  plotType?: string;
  transferFee?: number;
  salePrice?: number;
  outstandingDues?: number;
  witness1Name?: string;
  witness1CNIC?: string;
  witness1Phone?: string;
  witness2Name?: string;
  witness2CNIC?: string;
  witness2Phone?: string;
  authorizedSignatory?: string;
}

export interface PaymentBreakdownItem {
  description: string;
  amount: number;
}

export interface PaymentReceiptData {
  societyName: string;
  societyAddress?: string;
  societyPhone?: string;
  societyEmail?: string;
  societyLogo?: string;
  receiptNumber: string;
  date: string;
  memberName: string;
  memberId?: string;
  memberCNIC?: string;
  memberPhone?: string;
  plotNumber: string;
  plotBlock?: string;
  plotSize?: string;
  paymentBreakdown: PaymentBreakdownItem[];
  subtotal?: number;
  discount?: number;
  lateFee?: number;
  totalAmount: number;
  amountInWords?: string;
  paymentMode: string;
  transactionId?: string;
  bankName?: string;
  chequeNumber?: string;
  periodFrom?: string;
  periodTo?: string;
  remarks?: string;
  authorizedSignatory?: string;
  qrCodeData?: string;
  receiptNote?: string;
}

export interface InstallmentScheduleItem {
  installmentNumber: number;
  dueDate: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue' | 'Upcoming';
  paidDate?: string;
  balance: number;
}

export interface InstallmentScheduleData {
  societyName: string;
  societyAddress?: string;
  societyPhone?: string;
  memberName: string;
  memberId?: string;
  memberCNIC?: string;
  memberPhone?: string;
  plotNumber: string;
  plotBlock?: string;
  plotSize?: string;
  plotType?: string;
  totalPrice: number;
  downPayment: number;
  totalInstallments: number;
  installmentAmount: number;
  planStartDate?: string;
  planEndDate?: string;
  schedule: InstallmentScheduleItem[];
  totalPaid: number;
  remainingBalance: number;
  notes?: string;
}

export interface GeneratePDFDto {
  templateName: 'receipt' | 'invoice' | 'certificate' | 'noc' | 'allotment-letter' | 'membership-form' | 'transfer-form' | 'payment-receipt' | 'installment-schedule';
  data: ReceiptData | InvoiceData | CertificateData | NOCData | AllotmentData | MembershipFormData | TransferFormData | PaymentReceiptData | InstallmentScheduleData;
  societyId?: string;
  uploadToCloud?: boolean;
}

export type TemplateName = 'receipt' | 'invoice' | 'certificate' | 'noc' | 'allotment-letter' | 'membership-form' | 'transfer-form' | 'payment-receipt' | 'installment-schedule';

export interface TemplateInfo {
  name: TemplateName;
  label: string;
  description: string;
  requiredFields: string[];
}
