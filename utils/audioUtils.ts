import { Blob } from '@google/genai';

export function float32ToPCM16(float32Array: Float32Array): Int16Array {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return int16Array;
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Adds padding to a base64 string if needed
 * @param base64 - Base64 string that may be missing padding
 * @returns Base64 string with proper padding
 */
export function addBase64Padding(base64: string): string {
  const padding = base64.length % 4;
  if (padding > 0) {
    return base64 + '='.repeat(4 - padding);
  }
  return base64;
}

/**
 * Converts a URL-safe base64 string to standard base64
 * @param urlSafeBase64 - URL-safe base64 string (using - and _ instead of + and /)
 * @returns Standard base64 string
 */
export function urlSafeBase64ToStandard(urlSafeBase64: string): string {
  // Replace URL-safe characters with standard base64 characters
  const base64 = urlSafeBase64.replace(/-/g, '+').replace(/_/g, '/');
  // Add padding if needed
  return addBase64Padding(base64);
}

/**
 * Converts a standard base64 string to URL-safe base64
 * @param base64 - Standard base64 string
 * @returns URL-safe base64 string (without padding)
 */
export function standardBase64ToUrlSafe(base64: string): string {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Converts base64 string (standard or URL-safe) to ArrayBuffer
 * @param base64 - Base64 string (can be standard or URL-safe format)
 * @returns ArrayBuffer containing the decoded data
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  // Use regex for efficient single-pass detection of base64 type
  // URL-safe base64 has - or _ and lacks + or /
  const hasUrlSafeChars = /[-_]/.test(base64);
  const hasStandardChars = /[+/]/.test(base64);
  
  // If it has URL-safe chars and no standard chars, convert it
  const standardBase64 = hasUrlSafeChars && !hasStandardChars
    ? urlSafeBase64ToStandard(base64) 
    : base64;
  
  // Ensure padding is present (addBase64Padding is idempotent)
  const paddedBase64 = addBase64Padding(standardBase64);
  
  const binaryString = atob(paddedBase64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export function createPCMBlob(data: Float32Array): Blob {
  const int16Data = float32ToPCM16(data);
  const base64 = arrayBufferToBase64(int16Data.buffer);
  return {
    data: base64,
    mimeType: 'audio/pcm;rate=16000',
  };
}

export async function decodeAudioData(
  base64Data: string,
  audioContext: AudioContext,
  sampleRate: number = 24000
): Promise<AudioBuffer> {
  const arrayBuffer = base64ToArrayBuffer(base64Data);
  
  // Safe handling for Int16Array which requires even byte length
  // If the buffer length is odd, we slice off the last byte
  const padding = arrayBuffer.byteLength % 2;
  const safeBuffer = padding > 0 
    ? arrayBuffer.slice(0, arrayBuffer.byteLength - padding) 
    : arrayBuffer;
  
  const dataInt16 = new Int16Array(safeBuffer);
  const float32Data = new Float32Array(dataInt16.length);
  
  for (let i = 0; i < dataInt16.length; i++) {
    float32Data[i] = dataInt16[i] / 32768.0;
  }

  const audioBuffer = audioContext.createBuffer(1, float32Data.length, sampleRate);
  audioBuffer.copyToChannel(float32Data, 0);
  return audioBuffer;
}