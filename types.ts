
export enum Role {
  ADMIN = 'Admin',
  SUPPORT = 'IT Support Staff',
  COORDINATOR = 'Coordinator'
}

export enum RequesterType {
  STUDENT = 'Student',
  PARENT = 'Parent',
  TEACHER = 'Teacher',
  STAFF = 'Staff'
}

export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  CLOSED = 'CLOSED'
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum FieldType {
  SHORT_TEXT = 'SHORT_TEXT',
  DROPDOWN = 'DROPDOWN',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE'
}

export interface CustomField {
  id: string;
  label: string;
  type: FieldType;
  options?: string[]; // For dropdowns/multi-choice
  required: boolean;
}

export interface EmailConfig {
  smtpHost: string;
  smtpPort: string;
  senderEmail: string;
  senderName: string;
  authEnabled: boolean;
}

export interface NotificationPreferences {
  notifyOnCreation: boolean;
  notifyOnStatusChange: boolean;
  notifyOnAssignment: boolean;
  notifyOnResolution: boolean;
}

export interface AppSettings {
  themeColor: string;
  categories: string[];
  customFields: CustomField[];
  emailConfig: EmailConfig;
  notifications: NotificationPreferences;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  password?: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  category: string;
  status: TicketStatus;
  priority: Priority;
  requesterType: RequesterType;
  grade?: string;
  section?: string;
  studentName?: string;
  createdBy: {
    name: string;
    email: string;
  };
  assignedTo?: string;
  attachment?: string;
  createdAt: string;
  updatedAt: string;
  comments: Comment[];
  customData?: Record<string, any>; // Stores responses to custom fields
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
}

export const CATEGORIES = [
  'Network/Wi-Fi',
  'Hardware (PC/Laptop)',
  'Printer/Scanner',
  'Software/App Support',
  'Smart Board/Projector',
  'Email/Account Access',
  'Other'
];

export const GRADES = ['Nursery', 'KG', 'Prep', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
export const SECTIONS = ['A', 'B', 'C', 'D'];
