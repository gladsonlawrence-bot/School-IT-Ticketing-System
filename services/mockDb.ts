
import { Ticket, User, Role, TicketStatus, Priority, RequesterType, AppSettings, CATEGORIES } from '../types';

const USERS_KEY = 'edu_it_users';
const TICKETS_KEY = 'edu_it_tickets';
const SETTINGS_KEY = 'edu_it_settings';

const DEFAULT_SETTINGS: AppSettings = {
  themeColor: '#0870b8',
  categories: [...CATEGORIES],
  customFields: [],
  emailConfig: {
    smtpHost: 'smtp.gmis.sch.id',
    smtpPort: '587',
    senderEmail: 'it.support@gmis.sch.id',
    senderName: 'GMIS IT Support',
    authEnabled: true
  },
  notifications: {
    notifyOnCreation: true,
    notifyOnStatusChange: true,
    notifyOnAssignment: true,
    notifyOnResolution: true
  }
};

const DEFAULT_USERS: User[] = [
  { id: '1', name: 'Gladson Lawrence', email: 'gladson.lawrence@gmis.sch.id', role: Role.ADMIN, password: 'password' },
  { id: '2', name: 'John Tech', email: 'john@school.edu', role: Role.SUPPORT, password: 'password' },
];

export const db = {
  getSettings: (): AppSettings => {
    const data = localStorage.getItem(SETTINGS_KEY);
    return data ? JSON.parse(data) : DEFAULT_SETTINGS;
  },

  saveSettings: (settings: AppSettings) => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  },

  getUsers: (): User[] => {
    const data = localStorage.getItem(USERS_KEY);
    if (!data) {
      localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    return JSON.parse(data);
  },

  getTickets: (): Ticket[] => {
    const data = localStorage.getItem(TICKETS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveTicket: (ticket: Ticket) => {
    const tickets = db.getTickets();
    const existing = tickets.findIndex(t => t.id === ticket.id);
    if (existing >= 0) {
      tickets[existing] = ticket;
    } else {
      tickets.push(ticket);
    }
    localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
  },

  getTicketById: (id: string): Ticket | undefined => {
    return db.getTickets().find(t => t.id === id);
  },

  saveUser: (user: User) => {
    const users = db.getUsers();
    users.push(user);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
};
