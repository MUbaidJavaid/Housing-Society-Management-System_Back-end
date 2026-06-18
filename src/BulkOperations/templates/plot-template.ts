import { TemplateColumn, RowValidationResult } from '../types/types-bulk-operations';

export const columns: TemplateColumn[] = [
  { key: 'plotNumber', label: 'Plot Number', required: true, type: 'string', example: 'A-101', validation: 'Unique plot identifier' },
  { key: 'blockName', label: 'Block Name', required: true, type: 'string', example: 'Block A', validation: 'Block name or ID' },
  { key: 'categoryName', label: 'Category', required: true, type: 'string', example: 'Residential', validation: 'Plot category name' },
  { key: 'sizeName', label: 'Size', required: true, type: 'string', example: '5 Marla', validation: 'Plot size name' },
  { key: 'typeName', label: 'Type', required: true, type: 'string', example: 'Standard', validation: 'Plot type name' },
  { key: 'area', label: 'Area (sq ft)', required: true, type: 'number', example: '1125', validation: 'Positive number' },
  { key: 'price', label: 'Price', required: true, type: 'number', example: '2500000', validation: 'Positive number' },
  { key: 'facing', label: 'Facing', required: false, type: 'string', example: 'North', validation: 'N, S, E, W, NE, NW, SE, SW' },
  { key: 'status', label: 'Status', required: false, type: 'string', example: 'Available', validation: 'Available, Sold, Reserved, etc.' },
];

export function getCSVHeader(): string {
  return columns.map(c => c.label).join(',');
}

export function getExampleRows(): string {
  const rows = [
    'A-101,Block A,Residential,5 Marla,Standard,1125,2500000,North,Available',
    'B-205,Block B,Commercial,10 Marla,Corner,2250,5500000,East,Available',
    'C-310,Block C,Residential,7 Marla,Park Facing,1575,3800000,South,Reserved',
  ];
  return rows.join('\n');
}

export function validateRow(row: Record<string, string>, _rowIndex: number): RowValidationResult {
  const errors: Array<{ field: string; message: string }> = [];

  if (!row.plotNumber || row.plotNumber.trim().length === 0) {
    errors.push({ field: 'plotNumber', message: 'Plot number is required' });
  }

  if (!row.blockName || row.blockName.trim().length === 0) {
    errors.push({ field: 'blockName', message: 'Block name is required' });
  }

  if (!row.categoryName || row.categoryName.trim().length === 0) {
    errors.push({ field: 'categoryName', message: 'Category name is required' });
  }

  if (!row.sizeName || row.sizeName.trim().length === 0) {
    errors.push({ field: 'sizeName', message: 'Size name is required' });
  }

  if (!row.typeName || row.typeName.trim().length === 0) {
    errors.push({ field: 'typeName', message: 'Type name is required' });
  }

  if (!row.area || isNaN(Number(row.area)) || Number(row.area) <= 0) {
    errors.push({ field: 'area', message: 'Area must be a positive number' });
  }

  if (!row.price || isNaN(Number(row.price)) || Number(row.price) <= 0) {
    errors.push({ field: 'price', message: 'Price must be a positive number' });
  }

  if (row.facing && row.facing.trim().length > 0) {
    const validFacings = ['N', 'S', 'E', 'W', 'NE', 'NW', 'SE', 'SW', 'North', 'South', 'East', 'West'];
    if (!validFacings.map(f => f.toLowerCase()).includes(row.facing.trim().toLowerCase())) {
      errors.push({ field: 'facing', message: 'Facing must be one of: N, S, E, W, NE, NW, SE, SW' });
    }
  }

  return { valid: errors.length === 0, errors };
}

export function transformRow(row: Record<string, string>): Record<string, any> {
  return {
    plotNo: row.plotNumber.trim(),
    blockName: row.blockName.trim(),
    categoryName: row.categoryName.trim(),
    sizeName: row.sizeName.trim(),
    typeName: row.typeName.trim(),
    plotArea: Number(row.area),
    plotBasePrice: Number(row.price),
    plotTotalAmount: Number(row.price),
    plotFacing: row.facing?.trim() || undefined,
    salesStatusName: row.status?.trim() || 'Available',
    discountAmount: 0,
    surchargeAmount: 0,
    isPossessionReady: false,
    isDeleted: false,
  };
}
