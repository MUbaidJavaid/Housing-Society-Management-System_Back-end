import { TemplateColumn, RowValidationResult } from '../types/types-bulk-operations';

export const columns: TemplateColumn[] = [
  { key: 'membershipNumber', label: 'Membership Number', required: true, type: 'string', example: 'MEM-001', validation: 'Existing member registration number' },
  { key: 'plotNumber', label: 'Plot Number', required: true, type: 'string', example: 'A-101', validation: 'Existing plot number' },
  { key: 'billType', label: 'Bill Type', required: true, type: 'string', example: 'Maintenance', validation: 'Bill type name' },
  { key: 'amount', label: 'Amount', required: true, type: 'number', example: '5000', validation: 'Positive number' },
  { key: 'dueDate', label: 'Due Date', required: true, type: 'date', example: '2026-07-15', validation: 'Format: YYYY-MM-DD' },
  { key: 'description', label: 'Description', required: false, type: 'string', example: 'Monthly maintenance charge', validation: 'Max 500 chars' },
];

export function getCSVHeader(): string {
  return columns.map(c => c.label).join(',');
}

export function getExampleRows(): string {
  const rows = [
    'MEM-001,A-101,Maintenance,5000,2026-07-15,Monthly maintenance charge',
    'MEM-002,B-205,Water,1500,2026-07-20,Water supply charges',
    'MEM-003,C-310,Security,2000,2026-07-25,Security guard charges',
  ];
  return rows.join('\n');
}

export function validateRow(row: Record<string, string>, _rowIndex: number): RowValidationResult {
  const errors: Array<{ field: string; message: string }> = [];

  if (!row.membershipNumber || row.membershipNumber.trim().length === 0) {
    errors.push({ field: 'membershipNumber', message: 'Membership number is required' });
  }

  if (!row.plotNumber || row.plotNumber.trim().length === 0) {
    errors.push({ field: 'plotNumber', message: 'Plot number is required' });
  }

  if (!row.billType || row.billType.trim().length === 0) {
    errors.push({ field: 'billType', message: 'Bill type is required' });
  }

  if (!row.amount || isNaN(Number(row.amount)) || Number(row.amount) <= 0) {
    errors.push({ field: 'amount', message: 'Amount must be a positive number' });
  }

  if (!row.dueDate || row.dueDate.trim().length === 0) {
    errors.push({ field: 'dueDate', message: 'Due date is required' });
  } else {
    const date = new Date(row.dueDate.trim());
    if (isNaN(date.getTime())) {
      errors.push({ field: 'dueDate', message: 'Invalid date format. Use YYYY-MM-DD' });
    }
  }

  if (row.description && row.description.trim().length > 500) {
    errors.push({ field: 'description', message: 'Description cannot exceed 500 characters' });
  }

  return { valid: errors.length === 0, errors };
}

export function transformRow(row: Record<string, string>): Record<string, any> {
  const dueDate = new Date(row.dueDate.trim());
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const billMonth = `${monthNames[dueDate.getMonth()]} ${dueDate.getFullYear()}`;

  return {
    memberRegNo: row.membershipNumber.trim(),
    plotNo: row.plotNumber.trim(),
    billTypeName: row.billType.trim(),
    billAmount: Number(row.amount),
    totalPayable: Number(row.amount),
    fineAmount: 0,
    arrears: 0,
    dueDate: dueDate,
    billMonth: billMonth,
    gracePeriodDays: 15,
    status: 'Pending',
    notes: row.description?.trim() || undefined,
    isActive: true,
    isDeleted: false,
  };
}
