import { TemplateColumn, RowValidationResult } from '../types/types-bulk-operations';

export const columns: TemplateColumn[] = [
  { key: 'membershipNumber', label: 'Membership Number', required: false, type: 'string', example: 'MEM-001', validation: 'Alphanumeric, max 50 chars' },
  { key: 'firstName', label: 'First Name', required: true, type: 'string', example: 'Ahmed', validation: 'Min 2, max 50 chars' },
  { key: 'lastName', label: 'Last Name', required: true, type: 'string', example: 'Khan', validation: 'Min 2, max 50 chars' },
  { key: 'fatherName', label: 'Father Name', required: false, type: 'string', example: 'Muhammad Khan', validation: 'Max 100 chars' },
  { key: 'cnic', label: 'CNIC', required: true, type: 'string', example: '35201-1234567-1', validation: 'Format: XXXXX-XXXXXXX-X' },
  { key: 'email', label: 'Email', required: false, type: 'string', example: 'ahmed@example.com', validation: 'Valid email format' },
  { key: 'phone', label: 'Phone', required: true, type: 'string', example: '0300-1234567', validation: 'Valid phone number' },
  { key: 'address', label: 'Address', required: true, type: 'string', example: '123 Main Street, Lahore', validation: 'Max 200 chars' },
  { key: 'city', label: 'City', required: false, type: 'string', example: 'Lahore', validation: 'Max 50 chars' },
  { key: 'dateOfBirth', label: 'Date of Birth', required: false, type: 'date', example: '1990-01-15', validation: 'Format: YYYY-MM-DD' },
  { key: 'gender', label: 'Gender', required: false, type: 'string', example: 'male', validation: 'male, female, or other' },
  { key: 'occupation', label: 'Occupation', required: false, type: 'string', example: 'Engineer', validation: 'Max 100 chars' },
  { key: 'bloodGroup', label: 'Blood Group', required: false, type: 'string', example: 'A+', validation: 'A+, A-, B+, B-, AB+, AB-, O+, O-' },
];

export function getCSVHeader(): string {
  return columns.map(c => c.label).join(',');
}

export function getExampleRows(): string {
  const rows = [
    'MEM-001,Ahmed,Khan,Muhammad Khan,35201-1234567-1,ahmed@example.com,0300-1234567,"123 Main Street, Lahore",Lahore,1990-01-15,male,Engineer,A+',
    'MEM-002,Sara,Ali,Ali Ahmed,35202-7654321-2,sara@example.com,0321-7654321,"456 Park Road, Karachi",Karachi,1995-06-20,female,Doctor,B+',
    'MEM-003,Usman,Malik,Malik Riaz,35203-1112233-3,,0333-1112233,"789 Garden Town, Islamabad",Islamabad,1988-11-05,male,Business,O+',
  ];
  return rows.join('\n');
}

export function validateRow(row: Record<string, string>, _rowIndex: number): RowValidationResult {
  const errors: Array<{ field: string; message: string }> = [];

  // firstName - required
  if (!row.firstName || row.firstName.trim().length < 2) {
    errors.push({ field: 'firstName', message: 'First name is required and must be at least 2 characters' });
  }

  // lastName - required
  if (!row.lastName || row.lastName.trim().length < 2) {
    errors.push({ field: 'lastName', message: 'Last name is required and must be at least 2 characters' });
  }

  // cnic - required
  if (!row.cnic || row.cnic.trim().length === 0) {
    errors.push({ field: 'cnic', message: 'CNIC is required' });
  } else if (!/^\d{5}-?\d{7}-?\d{1}$/.test(row.cnic.trim())) {
    errors.push({ field: 'cnic', message: 'CNIC must be in format XXXXX-XXXXXXX-X or 13 digits' });
  }

  // phone - required
  if (!row.phone || row.phone.trim().length === 0) {
    errors.push({ field: 'phone', message: 'Phone number is required' });
  }

  // address - required
  if (!row.address || row.address.trim().length === 0) {
    errors.push({ field: 'address', message: 'Address is required' });
  }

  // email - optional but validate format if provided
  if (row.email && row.email.trim().length > 0) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(row.email.trim())) {
      errors.push({ field: 'email', message: 'Invalid email format' });
    }
  }

  // dateOfBirth - optional but validate format if provided
  if (row.dateOfBirth && row.dateOfBirth.trim().length > 0) {
    const date = new Date(row.dateOfBirth.trim());
    if (isNaN(date.getTime())) {
      errors.push({ field: 'dateOfBirth', message: 'Invalid date format. Use YYYY-MM-DD' });
    }
  }

  // gender - optional but validate value if provided
  if (row.gender && row.gender.trim().length > 0) {
    if (!['male', 'female', 'other'].includes(row.gender.trim().toLowerCase())) {
      errors.push({ field: 'gender', message: 'Gender must be male, female, or other' });
    }
  }

  // bloodGroup - optional but validate if provided
  if (row.bloodGroup && row.bloodGroup.trim().length > 0) {
    const validGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    if (!validGroups.includes(row.bloodGroup.trim().toUpperCase())) {
      errors.push({ field: 'bloodGroup', message: 'Invalid blood group. Must be one of: A+, A-, B+, B-, AB+, AB-, O+, O-' });
    }
  }

  return { valid: errors.length === 0, errors };
}

export function transformRow(row: Record<string, string>): Record<string, any> {
  const fullName = `${row.firstName.trim()} ${row.lastName.trim()}`;
  return {
    memName: fullName,
    memRegNo: row.membershipNumber?.trim() || undefined,
    memFHName: row.fatherName?.trim() || undefined,
    memNic: row.cnic.trim().replace(/-/g, '').toUpperCase(),
    memContEmail: row.email?.trim().toLowerCase() || undefined,
    memContMob: row.phone.trim(),
    memAddr1: row.address.trim(),
    memState: row.city?.trim() || undefined,
    dateOfBirth: row.dateOfBirth?.trim() ? new Date(row.dateOfBirth.trim()) : undefined,
    gender: row.gender?.trim().toLowerCase() || undefined,
    memOccupation: row.occupation?.trim() || undefined,
    isActive: true,
    isDeleted: false,
  };
}
