export interface Location {
  id?: number;
  code: string;
  name: string;
  type: string;
  address?: string;
  capacity: number;
  usedCapacity?: number;
  status?: "ACTIVE" | "MAINTENANCE" | "INACTIVE";
  temperatureControlled?: boolean;
  minTemperature?: number;
  maxTemperature?: number;
}
