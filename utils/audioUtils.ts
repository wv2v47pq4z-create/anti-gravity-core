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

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
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