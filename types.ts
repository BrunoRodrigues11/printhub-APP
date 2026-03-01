export interface Site {
  id: string;
  name: string;
  description?: string;
}

export enum PrinterStatus {
  ONLINE = 'Online',
  OFFLINE = 'Offline',
  MAINTENANCE = 'Manutenção'
}

export enum PrinterType {
  THERMAL = 'Térmica',
  PAPER = 'Papel'
}

export interface Printer {
  id: string;
  name: string;
  type: PrinterType;
  model: string;
  manufacturer: string;
  serialNumber: string;
  assetId: string; // RI / Patrimônio
  site: string; // Localidade (ex: Fabrica 1, CD, Escritório)
  location: string;
  ipAddress?: string;
  queueName: string;
  tonerCode?: string; // Código do Toner (ex: CF258A)
  status: PrinterStatus;
  lastUpdated: string;
  notes?: string;
}

export interface StatCount {
  online: number;
  offline: number;
  maintenance: number;
  total: number;
}

export enum UserRole {
  ADMIN = 'Admin',
  ANALYST = 'Analista',
  USER = 'User'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  site?: string; // Unidade vinculada
  lastLogin?: string;
  password?: string;
}
