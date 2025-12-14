export enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR'
}

export interface AudioFrequencyData {
  values: Uint8Array;
  average: number;
  peak: number;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  sender: 'USER' | 'GAC' | 'SYSTEM';
  text: string;
  type: 'info' | 'message' | 'error';
}

export interface ZacConfig {
  sensitivity: number;
  volume: number;
  resonance: number; // A visual parameter
  voiceName: string;
}

export enum VisualizerMode {
  ORB = 'ORB',
  WAVE = 'WAVE',
  BARS = 'BARS'
}