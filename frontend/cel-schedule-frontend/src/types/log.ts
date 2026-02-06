import { LogType } from './enums';

// System Log types

export interface SystemLog {
  id: string;
  logType: LogType;
  timeStamp: string;
  metadata: Record<string, unknown>;
}
