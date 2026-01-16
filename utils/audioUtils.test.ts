import { describe, it, expect } from 'vitest';
import {
  addBase64Padding,
  urlSafeBase64ToStandard,
  standardBase64ToUrlSafe,
  base64ToArrayBuffer,
  arrayBufferToBase64,
} from './audioUtils';

describe('addBase64Padding', () => {
  it('should add padding for strings needing 1 character', () => {
    const input = 'SGVsbG8gV29ybGQ'; // 15 chars, needs 1 padding
    const result = addBase64Padding(input);
    expect(result).toBe('SGVsbG8gV29ybGQ=');
    expect(result.length % 4).toBe(0);
  });

  it('should add padding for strings needing 2 characters', () => {
    const input = 'SGVsbG8gV29ybA'; // 14 chars, needs 2 padding
    const result = addBase64Padding(input);
    expect(result).toBe('SGVsbG8gV29ybA==');
    expect(result.length % 4).toBe(0);
  });

  it('should add padding for strings needing 3 characters', () => {
    const input = 'SGVsbG8gV29yb'; // 13 chars, needs 3 padding to reach 16
    const result = addBase64Padding(input);
    expect(result).toBe('SGVsbG8gV29yb===');
    expect(result.length % 4).toBe(0);
  });

  it('should not modify already-padded strings', () => {
    const input = 'SGVsbG8gV29ybGQ=';
    const result = addBase64Padding(input);
    expect(result).toBe(input);
  });

  it('should not modify strings with length divisible by 4', () => {
    const input = 'ABCDEFGH'; // 8 chars, no padding needed
    const result = addBase64Padding(input);
    expect(result).toBe(input);
  });
});

describe('urlSafeBase64ToStandard', () => {
  it('should convert URL-safe characters to standard base64', () => {
    const input = 'AB-CD_EF';
    const result = urlSafeBase64ToStandard(input);
    expect(result).toBe('AB+CD/EF');
  });

  it('should add padding when needed', () => {
    const input = 'SGVsbG8gV29ybGQ'; // URL-safe without padding
    const result = urlSafeBase64ToStandard(input);
    expect(result).toBe('SGVsbG8gV29ybGQ=');
    expect(result.length % 4).toBe(0);
  });

  it('should handle strings with multiple URL-safe characters', () => {
    const input = 'A-B_C-D_';
    const result = urlSafeBase64ToStandard(input);
    expect(result).toBe('A+B/C+D/');
  });

  it('should handle already standard base64 strings', () => {
    const input = 'AB+CD/EF';
    const result = urlSafeBase64ToStandard(input);
    // Should just add padding if needed
    expect(result).toBe('AB+CD/EF');
  });

  it('should handle double-encoded scenario', () => {
    // Simulate double-encoded API response
    const original = 'my-secret-key';
    const firstEncode = btoa(original); // Standard base64
    const urlSafeFirstEncode = firstEncode.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    
    const result = urlSafeBase64ToStandard(urlSafeFirstEncode);
    expect(result).toBe(firstEncode);
  });
});

describe('standardBase64ToUrlSafe', () => {
  it('should convert standard base64 to URL-safe', () => {
    const input = 'AB+CD/EF';
    const result = standardBase64ToUrlSafe(input);
    expect(result).toBe('AB-CD_EF');
  });

  it('should remove padding', () => {
    const input = 'SGVsbG8gV29ybGQ=';
    const result = standardBase64ToUrlSafe(input);
    expect(result).toBe('SGVsbG8gV29ybGQ');
    expect(result).not.toContain('=');
  });

  it('should remove multiple padding characters', () => {
    const input = 'SGVsbG8gV29ybA==';
    const result = standardBase64ToUrlSafe(input);
    expect(result).toBe('SGVsbG8gV29ybA');
    expect(result).not.toContain('=');
  });

  it('should handle already URL-safe input', () => {
    const input = 'AB-CD_EF';
    const result = standardBase64ToUrlSafe(input);
    // Should convert - and _ to - and _ (no change) and remove padding
    expect(result).toBe('AB-CD_EF');
  });

  it('should handle strings without padding', () => {
    const input = 'ABCDEFGH';
    const result = standardBase64ToUrlSafe(input);
    expect(result).toBe('ABCDEFGH');
  });
});

describe('base64ToArrayBuffer', () => {
  it('should decode standard base64 with padding', () => {
    const testString = 'Hello World';
    const base64 = btoa(testString);
    const buffer = base64ToArrayBuffer(base64);
    const decoded = new TextDecoder().decode(buffer);
    expect(decoded).toBe(testString);
  });

  it('should decode standard base64 without padding', () => {
    const testString = 'Hello World';
    const base64 = btoa(testString).replace(/=+$/, '');
    const buffer = base64ToArrayBuffer(base64);
    const decoded = new TextDecoder().decode(buffer);
    expect(decoded).toBe(testString);
  });

  it('should decode URL-safe base64', () => {
    const testString = 'Test with special chars: +/=';
    const standardBase64 = btoa(testString);
    const urlSafeBase64 = standardBase64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    
    const buffer = base64ToArrayBuffer(urlSafeBase64);
    const decoded = new TextDecoder().decode(buffer);
    expect(decoded).toBe(testString);
  });

  it('should handle double-encoded base64', () => {
    const original = 'secret-key-123';
    const firstEncode = btoa(original);
    const secondEncode = btoa(firstEncode);
    
    // Decode first level
    const firstBuffer = base64ToArrayBuffer(secondEncode);
    const firstDecoded = new TextDecoder().decode(firstBuffer);
    expect(firstDecoded).toBe(firstEncode);
    
    // Decode second level
    const secondBuffer = base64ToArrayBuffer(firstDecoded);
    const finalDecoded = new TextDecoder().decode(secondBuffer);
    expect(finalDecoded).toBe(original);
  });

  it('should not falsely detect standard base64 as URL-safe', () => {
    const testString = 'Test data';
    const standardBase64 = btoa(testString);
    
    const buffer = base64ToArrayBuffer(standardBase64);
    const decoded = new TextDecoder().decode(buffer);
    expect(decoded).toBe(testString);
  });

  it('should handle empty strings', () => {
    const buffer = base64ToArrayBuffer('');
    expect(buffer.byteLength).toBe(0);
  });

  it('should handle base64 with URL-safe chars and proper conversion', () => {
    // Create a base64 string that would have + or / in standard encoding
    const testData = new Uint8Array([255, 254, 253]); // Will create + and / chars
    const standardBase64 = arrayBufferToBase64(testData.buffer);
    const urlSafeBase64 = standardBase64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    
    const buffer = base64ToArrayBuffer(urlSafeBase64);
    const resultArray = new Uint8Array(buffer);
    expect(resultArray).toEqual(testData);
  });
});

describe('Round-trip conversions', () => {
  it('should preserve data through standard base64 round-trip', () => {
    const original = 'Test data with special chars: 123!@#$%';
    const base64 = btoa(original);
    const buffer = base64ToArrayBuffer(base64);
    const decoded = new TextDecoder().decode(buffer);
    expect(decoded).toBe(original);
  });

  it('should preserve data through URL-safe conversion round-trip', () => {
    const original = 'Another test: +/=';
    const standardBase64 = btoa(original);
    const urlSafeBase64 = standardBase64ToUrlSafe(standardBase64);
    const backToStandard = urlSafeBase64ToStandard(urlSafeBase64);
    expect(backToStandard).toBe(standardBase64);
  });

  it('should preserve data through full conversion cycle', () => {
    const original = 'Full cycle test';
    const standardBase64 = btoa(original);
    const urlSafe = standardBase64ToUrlSafe(standardBase64);
    const buffer = base64ToArrayBuffer(urlSafe);
    const decoded = new TextDecoder().decode(buffer);
    expect(decoded).toBe(original);
  });
});
