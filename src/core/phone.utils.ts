// src/core/utils/phone.utils.ts
import { CountryCode, parsePhoneNumberFromString } from 'libphonenumber-js';

export interface PhoneValidationResult {
  isValid: boolean;
  formattedNumber?: string;
  countryCode?: string;
  nationalNumber?: string;
  error?: string;
}

export class PhoneService {
  /**
   * Validate and format phone number
   */
  static validateAndFormat(
    phoneNumber: string,
    defaultCountry: CountryCode = 'PK'
  ): PhoneValidationResult {
    try {
      // Clean the input
      const cleaned = phoneNumber.trim();

      if (!cleaned) {
        return {
          isValid: false,
          error: 'Phone number is required',
        };
      }

      // Parse phone number
      const phone = parsePhoneNumberFromString(cleaned, defaultCountry);

      if (!phone) {
        return {
          isValid: false,
          error: 'Invalid phone number format',
        };
      }

      // Check if valid
      if (!phone.isValid()) {
        return {
          isValid: false,
          error: 'Phone number is not valid',
        };
      }

      // Return formatted result
      return {
        isValid: true,
        formattedNumber: phone.formatInternational(),
        countryCode: phone.country,
        nationalNumber: phone.nationalNumber,
      };
    } catch (error: any) {
      return {
        isValid: false,
        error: error.message || 'Phone validation failed',
      };
    }
  }

  /**
   * Get country from phone number
   */
  static getCountryFromPhone(phoneNumber: string): string | undefined {
    try {
      const phone = parsePhoneNumberFromString(phoneNumber);
      return phone?.country;
    } catch {
      return undefined;
    }
  }

  /**
   * Format phone for display
   */
  static formatForDisplay(phoneNumber: string): string {
    try {
      const phone = parsePhoneNumberFromString(phoneNumber);
      return phone?.formatInternational() || phoneNumber;
    } catch {
      return phoneNumber;
    }
  }

  /**
   * Format phone for storage (E.164 format)
   */
  static formatForStorage(phoneNumber: string): string {
    try {
      const phone = parsePhoneNumberFromString(phoneNumber);
      return phone?.format('E.164') || phoneNumber;
    } catch {
      return phoneNumber;
    }
  }

  /**
   * Check if number is mobile
   */
  static isMobileNumber(phoneNumber: string): boolean {
    try {
      const phone = parsePhoneNumberFromString(phoneNumber);
      if (!phone) return false;

      const type = phone.getType();
      return type === 'MOBILE' || type === 'FIXED_LINE_OR_MOBILE';
    } catch {
      return false;
    }
  }

  /**
   * Extract country code
   */
  static extractCountryCode(phoneNumber: string): string {
    try {
      const phone = parsePhoneNumberFromString(phoneNumber);
      return phone?.countryCallingCode || '';
    } catch {
      return '';
    }
  }

  /**
   * Normalize phone number (remove all non-digits except +)
   */
  static normalizePhone(phoneNumber: string): string {
    // Keep + at the beginning if present
    const hasPlus = phoneNumber.startsWith('+');
    const digits = phoneNumber.replace(/\D/g, '');
    return hasPlus ? '+' + digits : digits;
  }
}

// Country data for reference
export const COUNTRIES = [
  { code: 'PK', name: 'Pakistan', dialCode: '+92' },
  { code: 'US', name: 'United States', dialCode: '+1' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44' },
  { code: 'IN', name: 'India', dialCode: '+91' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966' },
  { code: 'BD', name: 'Bangladesh', dialCode: '+880' },
  { code: 'CA', name: 'Canada', dialCode: '+1' },
  { code: 'AU', name: 'Australia', dialCode: '+61' },
  { code: 'DE', name: 'Germany', dialCode: '+49' },
  { code: 'FR', name: 'France', dialCode: '+33' },
  { code: 'CN', name: 'China', dialCode: '+86' },
  { code: 'JP', name: 'Japan', dialCode: '+81' },
  { code: 'KR', name: 'South Korea', dialCode: '+82' },
  { code: 'SG', name: 'Singapore', dialCode: '+65' },
  { code: 'MY', name: 'Malaysia', dialCode: '+60' },
  { code: 'ID', name: 'Indonesia', dialCode: '+62' },
  // Add more countries as needed
];

export const getCountryByCode = (code: string) => {
  return COUNTRIES.find(c => c.code === code.toUpperCase());
};
