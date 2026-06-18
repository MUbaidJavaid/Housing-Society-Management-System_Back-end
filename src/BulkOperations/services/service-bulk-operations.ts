import { Types } from 'mongoose';
import { AppError } from '../../middleware/error.middleware';
import Member from '../../Member/models/models-member';
import ImportLog from '../models/models-import-log';
import {
  EntityType,
  ExportFormat,
  ExportResult,
  ImportLogQuery,
  ImportResult,
  PaginatedImportLogs,
  TemplateResult,
} from '../types/types-bulk-operations';
import * as memberTemplate from '../templates/member-template';
import * as plotTemplate from '../templates/plot-template';
import PlotBlock from '../../Plots/models/models-plotblock';
import PlotCategory from '../../Plots/models/models-plotcategory';
import PlotSize from '../../Plots/models/models-plotsize';
import * as billTemplate from '../templates/bill-template';

// Helper to get the template for an entity type
function getTemplate(entityType: EntityType) {
  switch (entityType) {
    case 'member':
      return memberTemplate;
    case 'plot':
      return plotTemplate;
    case 'bill':
      return billTemplate;
    default:
      return null;
  }
}

// Helper to parse CSV string into array of objects
function parseCSV(csvData: string): Record<string, string>[] {
  const lines = csvData.trim().split('\n');
  if (lines.length < 2) return [];

  // Parse header - handle quoted fields
  const header = parseCSVLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.length === 0) continue;

    const values = parseCSVLine(line);
    const row: Record<string, string> = {};

    header.forEach((key, index) => {
      row[key.trim()] = values[index]?.trim() || '';
    });

    rows.push(row);
  }

  return rows;
}

// Parse a single CSV line handling quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

// Map CSV header labels to template keys
function mapHeaderToKeys(header: string[], template: any): Record<string, string> {
  const mapping: Record<string, string> = {};
  const columns = template.columns;

  header.forEach((headerLabel) => {
    const trimmed = headerLabel.trim();
    // Try exact label match first
    const col = columns.find((c: any) => c.label.toLowerCase() === trimmed.toLowerCase());
    if (col) {
      mapping[trimmed] = col.key;
      return;
    }
    // Try key match
    const colByKey = columns.find((c: any) => c.key.toLowerCase() === trimmed.toLowerCase());
    if (colByKey) {
      mapping[trimmed] = colByKey.key;
      return;
    }
    // Use as-is
    mapping[trimmed] = trimmed;
  });

  return mapping;
}

// Re-map row keys from labels to template keys
function remapRow(row: Record<string, string>, headerMapping: Record<string, string>): Record<string, string> {
  const mapped: Record<string, string> = {};
  for (const [originalKey, value] of Object.entries(row)) {
    const mappedKey = headerMapping[originalKey] || originalKey;
    mapped[mappedKey] = value;
  }
  return mapped;
}

// Escape CSV value
function escapeCSV(value: any): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

class BulkOperationsService {
  /**
   * Export data from the database in CSV or JSON format
   */
  async exportData(
    entityType: EntityType,
    societyId: string,
    filters: Record<string, any> = {},
    format: ExportFormat = 'csv'
  ): Promise<ExportResult> {
    const query: Record<string, any> = {
      isDeleted: false,
      ...filters,
    };

    // Add societyId filter if the model supports it
    if (societyId) {
      query.societyId = new Types.ObjectId(societyId);
    }

    let data: string;
    let fileName: string;
    let contentType: string;

    switch (entityType) {
      case 'member': {
        const members = await Member.find(query).lean();
        if (format === 'json') {
          data = JSON.stringify(members, null, 2);
          fileName = `members-export-${Date.now()}.json`;
          contentType = 'application/json';
        } else {
          const headers = ['Membership Number', 'Name', 'Father Name', 'CNIC', 'Email', 'Phone', 'Address', 'City', 'Date of Birth', 'Gender', 'Occupation'];
          const rows = members.map(m => [
            escapeCSV(m.memRegNo),
            escapeCSV(m.memName),
            escapeCSV(m.memFHName),
            escapeCSV(m.memNic),
            escapeCSV(m.memContEmail),
            escapeCSV(m.memContMob),
            escapeCSV(m.memAddr1),
            escapeCSV(m.memState),
            escapeCSV(m.dateOfBirth ? new Date(m.dateOfBirth).toISOString().split('T')[0] : ''),
            escapeCSV(m.gender),
            escapeCSV(m.memOccupation),
          ].join(','));
          data = [headers.join(','), ...rows].join('\n');
          fileName = `members-export-${Date.now()}.csv`;
          contentType = 'text/csv';
        }
        break;
      }

      case 'plot': {
        let Plot: any;
        try {
          Plot = (await import('../../Plots/models/models-plot.js')).default;
        } catch {
          throw new AppError(500, 'Plot model not available');
        }
        const plots = await Plot.find(query).lean();
        if (format === 'json') {
          data = JSON.stringify(plots, null, 2);
          fileName = `plots-export-${Date.now()}.json`;
          contentType = 'application/json';
        } else {
          const headers = ['Plot Number', 'Area', 'Base Price', 'Total Amount', 'Facing', 'Is Possession Ready'];
          const rows = plots.map((p: any) => [
            escapeCSV(p.plotNo),
            escapeCSV(p.plotArea),
            escapeCSV(p.plotBasePrice),
            escapeCSV(p.plotTotalAmount),
            escapeCSV(p.plotFacing),
            escapeCSV(p.isPossessionReady),
          ].join(','));
          data = [headers.join(','), ...rows].join('\n');
          fileName = `plots-export-${Date.now()}.csv`;
          contentType = 'text/csv';
        }
        break;
      }

      case 'bill': {
        let BillInfo: any;
        try {
          BillInfo = (await import('../../BillI/models/models-bill-info.js')).default;
        } catch {
          throw new AppError(500, 'BillInfo model not available');
        }
        const bills = await BillInfo.find(query).lean();
        if (format === 'json') {
          data = JSON.stringify(bills, null, 2);
          fileName = `bills-export-${Date.now()}.json`;
          contentType = 'application/json';
        } else {
          const headers = ['Bill No', 'Bill Month', 'Amount', 'Total Payable', 'Due Date', 'Status', 'Notes'];
          const rows = bills.map((b: any) => [
            escapeCSV(b.billNo),
            escapeCSV(b.billMonth),
            escapeCSV(b.billAmount),
            escapeCSV(b.totalPayable),
            escapeCSV(b.dueDate ? new Date(b.dueDate).toISOString().split('T')[0] : ''),
            escapeCSV(b.status),
            escapeCSV(b.notes),
          ].join(','));
          data = [headers.join(','), ...rows].join('\n');
          fileName = `bills-export-${Date.now()}.csv`;
          contentType = 'text/csv';
        }
        break;
      }

      case 'payment': {
        let Payment: any;
        try {
          Payment = (await import('../../Payment/models/models-paymentmodule.js')).default;
        } catch {
          throw new AppError(500, 'Payment model not available');
        }
        const payments = await Payment.find(query).lean();
        if (format === 'json') {
          data = JSON.stringify(payments, null, 2);
          fileName = `payments-export-${Date.now()}.json`;
          contentType = 'application/json';
        } else {
          const headers = ['Payment ID', 'Amount', 'Date', 'Status'];
          const rows = payments.map((p: any) => [
            escapeCSV(p._id),
            escapeCSV(p.amount || p.paymentAmount),
            escapeCSV(p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : ''),
            escapeCSV(p.status || p.paymentStatus),
          ].join(','));
          data = [headers.join(','), ...rows].join('\n');
          fileName = `payments-export-${Date.now()}.csv`;
          contentType = 'text/csv';
        }
        break;
      }

      case 'installment': {
        let Installment: any;
        try {
          Installment = (await import('../../Installment/models/models-installment.js')).default;
        } catch {
          throw new AppError(500, 'Installment model not available');
        }
        const installments = await Installment.find(query).lean();
        if (format === 'json') {
          data = JSON.stringify(installments, null, 2);
          fileName = `installments-export-${Date.now()}.json`;
          contentType = 'application/json';
        } else {
          const headers = ['Installment ID', 'Amount', 'Due Date', 'Status'];
          const rows = installments.map((inst: any) => [
            escapeCSV(inst._id),
            escapeCSV(inst.amount || inst.installmentAmount),
            escapeCSV(inst.dueDate ? new Date(inst.dueDate).toISOString().split('T')[0] : ''),
            escapeCSV(inst.status || inst.installmentStatus),
          ].join(','));
          data = [headers.join(','), ...rows].join('\n');
          fileName = `installments-export-${Date.now()}.csv`;
          contentType = 'text/csv';
        }
        break;
      }

      case 'visitor': {
        let Visitor: any;
        try {
          Visitor = (await import('../../Visitor/models/models-visitor.js')).default;
        } catch {
          throw new AppError(500, 'Visitor model not available');
        }
        const visitors = await Visitor.find(query).lean();
        if (format === 'json') {
          data = JSON.stringify(visitors, null, 2);
          fileName = `visitors-export-${Date.now()}.json`;
          contentType = 'application/json';
        } else {
          const headers = ['Visitor ID', 'Name', 'CNIC', 'Phone', 'Purpose', 'Status'];
          const rows = visitors.map((v: any) => [
            escapeCSV(v._id),
            escapeCSV(v.visitorName || v.name),
            escapeCSV(v.visitorCnic || v.cnic),
            escapeCSV(v.visitorPhone || v.phone),
            escapeCSV(v.purpose),
            escapeCSV(v.status),
          ].join(','));
          data = [headers.join(','), ...rows].join('\n');
          fileName = `visitors-export-${Date.now()}.csv`;
          contentType = 'text/csv';
        }
        break;
      }

      default:
        throw new AppError(400, `Export not supported for entity type: ${entityType}`);
    }

    return { data, fileName, contentType };
  }

  /**
   * Import data from CSV into the database
   */
  async importData(
    entityType: EntityType,
    societyId: string,
    csvData: string,
    userId: string
  ): Promise<ImportResult> {
    const template = getTemplate(entityType);
    if (!template) {
      throw new AppError(400, `Import not supported for entity type: ${entityType}. Only member, plot, and bill imports are supported.`);
    }

    // Parse CSV
    const rawRows = parseCSV(csvData);
    if (rawRows.length === 0) {
      throw new AppError(400, 'No data rows found in CSV');
    }

    // Map header labels to template keys
    const firstRowKeys = Object.keys(rawRows[0]);
    const headerMapping = mapHeaderToKeys(firstRowKeys, template);

    // Create import log
    const importLog = new ImportLog({
      societyId: new Types.ObjectId(societyId),
      entityType,
      fileName: `${entityType}-import-${Date.now()}.csv`,
      totalRows: rawRows.length,
      status: 'processing',
      importedBy: new Types.ObjectId(userId),
    });
    await importLog.save();

    const errors: Array<{ row: number; field: string; message: string; data?: any }> = [];
    let successCount = 0;
    let failureCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < rawRows.length; i++) {
      const rowIndex = i + 2; // +2 because row 1 is header, data starts at row 2
      const mappedRow = remapRow(rawRows[i], headerMapping);

      // Validate row
      const validation = template.validateRow(mappedRow, rowIndex);
      if (!validation.valid) {
        failureCount++;
        validation.errors.forEach((err) => {
          errors.push({
            row: rowIndex,
            field: err.field,
            message: err.message,
            data: mappedRow,
          });
        });
        continue;
      }

      // Transform row
      const transformed = template.transformRow(mappedRow);

      // Insert into database
      try {
        switch (entityType) {
          case 'member': {
            const doc = new Member({
              ...transformed,
              societyId: new Types.ObjectId(societyId),
              createdBy: new Types.ObjectId(userId),
            });
            await doc.save();
            successCount++;
            break;
          }

          case 'plot': {
            let Plot: any;
            try {
              Plot = (await import('../../Plots/models/models-plot.js')).default;
            } catch {
              throw new AppError(500, 'Plot model not available');
            }

            // For plots we need to resolve block, category, size, type references
            // Store raw data - the caller may need to resolve references separately
            const plotDoc: Record<string, any> = {
              plotNo: transformed.plotNo,
              plotArea: transformed.plotArea,
              plotBasePrice: transformed.plotBasePrice,
              plotTotalAmount: transformed.plotTotalAmount,
              plotFacing: transformed.plotFacing,
              discountAmount: transformed.discountAmount,
              surchargeAmount: transformed.surchargeAmount,
              isPossessionReady: transformed.isPossessionReady,
              isDeleted: false,
              societyId: new Types.ObjectId(societyId),
              createdBy: new Types.ObjectId(userId),
            };

            // Try to resolve references by name
            try {
              const block = await PlotBlock.findOne({ blockName: transformed.blockName, isDeleted: false });
              if (block) plotDoc.plotBlockId = block._id;
            } catch { /* skip */ }

            try {
              const category = await PlotCategory.findOne({ categoryName: transformed.categoryName, isDeleted: false });
              if (category) plotDoc.plotCategoryId = category._id;
            } catch { /* skip */ }

            try {
              const size = await PlotSize.findOne({ sizeName: transformed.sizeName, isDeleted: false });
              if (size) plotDoc.plotSizeId = size._id;
            } catch { /* skip */ }

            // Check required references
            if (!plotDoc.plotBlockId) {
              failureCount++;
              errors.push({
                row: rowIndex,
                field: 'blockName',
                message: `Block "${transformed.blockName}" not found in system`,
                data: mappedRow,
              });
              continue;
            }

            const newPlot = new Plot(plotDoc);
            await newPlot.save();
            successCount++;
            break;
          }

          case 'bill': {
            let BillInfo: any;
            try {
              BillInfo = (await import('../../BillI/models/models-bill-info.js')).default;
            } catch {
              throw new AppError(500, 'BillInfo model not available');
            }

            // Resolve member by registration number
            const member = await Member.findOne({
              memRegNo: transformed.memberRegNo,
              isDeleted: false,
            });

            if (!member) {
              failureCount++;
              errors.push({
                row: rowIndex,
                field: 'membershipNumber',
                message: `Member with registration number "${transformed.memberRegNo}" not found`,
                data: mappedRow,
              });
              continue;
            }

            // Generate bill number
            const billNo = `BILL-${Date.now()}-${i}`.toUpperCase();

            const billDoc = new BillInfo({
              billNo,
              billAmount: transformed.billAmount,
              totalPayable: transformed.totalPayable,
              fineAmount: transformed.fineAmount,
              arrears: transformed.arrears,
              dueDate: transformed.dueDate,
              billMonth: transformed.billMonth,
              gracePeriodDays: transformed.gracePeriodDays,
              status: transformed.status,
              notes: transformed.notes,
              memId: member._id,
              createdBy: new Types.ObjectId(userId),
              isActive: true,
              isDeleted: false,
            });

            await billDoc.save();
            successCount++;
            break;
          }

          default:
            skippedCount++;
            break;
        }
      } catch (err: any) {
        failureCount++;
        errors.push({
          row: rowIndex,
          field: 'database',
          message: err.message || 'Failed to insert record',
          data: mappedRow,
        });
      }
    }

    // Update import log
    importLog.successCount = successCount;
    importLog.failureCount = failureCount;
    importLog.skippedCount = skippedCount;
    importLog.errors = errors as any;
    importLog.status = failureCount === rawRows.length ? 'failed' : 'completed';
    importLog.completedAt = new Date();
    await importLog.save();

    return {
      importId: importLog.importId,
      total: rawRows.length,
      success: successCount,
      failed: failureCount,
      skipped: skippedCount,
      errors,
    };
  }

  /**
   * Get import template for a given entity type
   */
  getImportTemplate(entityType: EntityType): TemplateResult {
    const template = getTemplate(entityType);
    if (!template) {
      throw new AppError(400, `Template not available for entity type: ${entityType}. Supported: member, plot, bill`);
    }

    return {
      columns: template.columns,
      csvHeader: template.getCSVHeader(),
      exampleData: template.getExampleRows(),
    };
  }

  /**
   * Get paginated import logs
   */
  async getImportLogs(params: ImportLogQuery): Promise<PaginatedImportLogs> {
    const {
      societyId,
      entityType,
      status,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const query: Record<string, any> = { isDeleted: false };

    if (societyId) query.societyId = new Types.ObjectId(societyId);
    if (entityType) query.entityType = entityType;
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [logs, total] = await Promise.all([
      ImportLog.find(query)
        .select('-errors')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('importedBy', 'firstName lastName email')
        .lean(),
      ImportLog.countDocuments(query),
    ]);

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a single import log by ID with full error details
   */
  async getImportLogById(id: string): Promise<any> {
    const log = await ImportLog.findById(id)
      .populate('importedBy', 'firstName lastName email')
      .lean();

    if (!log || log.isDeleted) {
      throw new AppError(404, 'Import log not found');
    }

    return log;
  }

  /**
   * Cancel a pending import
   */
  async cancelImport(id: string, userId: string): Promise<any> {
    const log = await ImportLog.findById(id);

    if (!log || log.isDeleted) {
      throw new AppError(404, 'Import log not found');
    }

    if (log.status !== 'pending') {
      throw new AppError(400, `Cannot cancel import with status "${log.status}". Only pending imports can be cancelled.`);
    }

    log.status = 'cancelled';
    log.completedAt = new Date();
    log.metadata = {
      ...((log.metadata as any) || {}),
      cancelledBy: userId,
      cancelledAt: new Date().toISOString(),
    };
    await log.save();

    return log;
  }
}

export const bulkOperationsService = new BulkOperationsService();
