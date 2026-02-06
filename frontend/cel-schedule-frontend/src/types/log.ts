import { LogType } from './enums';

// System Log types

export interface SystemLog {
  ID: string;
  Type: LogType;
  TimeDetected: string;
  Metadata: Record<string, unknown>;
  LastUpdated: string;
}
