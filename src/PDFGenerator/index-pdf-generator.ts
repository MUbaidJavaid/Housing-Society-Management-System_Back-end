// Export types
export * from './types/types-pdf-generator';

// Export templates
export { receiptTemplate } from './templates/receipt-template';
export { invoiceTemplate } from './templates/invoice-template';
export { certificateTemplate } from './templates/certificate-template';
export { nocTemplate } from './templates/noc-template';
export { allotmentLetterTemplate } from './templates/allotment-letter-template';

// Export service
export { pdfGeneratorService } from './services/service-pdf-generator';

// Export controller
export { pdfGeneratorController } from './controllers/controller-pdf-generator';

// Export routes
export { default as pdfGeneratorRoutes } from './routes/routes-pdf-generator';
