import { pgTable, text, serial, integer, timestamp, boolean, doublePrecision, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  photoURL: text("photo_url"),
  firebaseUid: text("firebase_uid").notNull().unique(),
  role: text("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  customers: many(customers),
  tasks: many(tasks),
  meetings: many(meetings),
  deals: many(deals),
}));

// Customers (companies/organizations) table
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  country: text("country"),
  industry: text("industry"),
  status: text("status").default("active"),
  website: text("website"),
  notes: text("notes"),
  totalValue: doublePrecision("total_value").default(0),
  assignedUserId: integer("assigned_user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const customersRelations = relations(customers, ({ one, many }) => ({
  assignedUser: one(users, {
    fields: [customers.assignedUserId],
    references: [users.id],
  }),
  contacts: many(contacts),
  deals: many(deals),
  meetings: many(meetings),
  interactions: many(interactions),
}));

// Contacts (people within customer organizations) table
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  jobTitle: text("job_title"),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  isPrimary: boolean("is_primary").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  customer: one(customers, {
    fields: [contacts.customerId],
    references: [customers.id],
  }),
  interactions: many(interactions),
}));

// Deals table
export const deals = pgTable("deals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  value: doublePrecision("value").default(0),
  currency: text("currency").default("USD"),
  stage: text("stage").notNull(), // lead, qualification, proposal, negotiation, closed_won, closed_lost
  probability: integer("probability").default(0), // 0-100
  expectedCloseDate: timestamp("expected_close_date"),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  assignedUserId: integer("assigned_user_id").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const dealsRelations = relations(deals, ({ one, many }) => ({
  customer: one(customers, {
    fields: [deals.customerId],
    references: [customers.id],
  }),
  assignedUser: one(users, {
    fields: [deals.assignedUserId],
    references: [users.id],
  }),
}));

// Tasks table
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  priority: text("priority").default("medium"), // low, medium, high, urgent
  status: text("status").default("pending"), // pending, in_progress, completed, cancelled
  assignedUserId: integer("assigned_user_id").references(() => users.id),
  customerId: integer("customer_id").references(() => customers.id),
  dealId: integer("deal_id").references(() => deals.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tasksRelations = relations(tasks, ({ one }) => ({
  assignedUser: one(users, {
    fields: [tasks.assignedUserId],
    references: [users.id],
  }),
  customer: one(customers, {
    fields: [tasks.customerId],
    references: [customers.id],
  }),
  deal: one(deals, {
    fields: [tasks.dealId],
    references: [deals.id],
  }),
}));

// Meetings table
export const meetings = pgTable("meetings", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  location: text("location"),
  meetingType: text("meeting_type").default("in_person"), // in_person, video, phone
  status: text("status").default("scheduled"), // scheduled, completed, cancelled
  notes: text("notes"),
  customerId: integer("customer_id").references(() => customers.id),
  assignedUserId: integer("assigned_user_id").references(() => users.id),
  dealId: integer("deal_id").references(() => deals.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const meetingsRelations = relations(meetings, ({ one, many }) => ({
  customer: one(customers, {
    fields: [meetings.customerId],
    references: [customers.id],
  }),
  assignedUser: one(users, {
    fields: [meetings.assignedUserId],
    references: [users.id],
  }),
  deal: one(deals, {
    fields: [meetings.dealId],
    references: [deals.id],
  }),
  attendees: many(meetingAttendees),
}));

// Meeting attendees (junction table for meetings and contacts)
export const meetingAttendees = pgTable("meeting_attendees", {
  id: serial("id").primaryKey(),
  meetingId: integer("meeting_id").references(() => meetings.id).notNull(),
  contactId: integer("contact_id").references(() => contacts.id).notNull(),
  attended: boolean("attended").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const meetingAttendeesRelations = relations(meetingAttendees, ({ one }) => ({
  meeting: one(meetings, {
    fields: [meetingAttendees.meetingId],
    references: [meetings.id],
  }),
  contact: one(contacts, {
    fields: [meetingAttendees.contactId],
    references: [contacts.id],
  }),
}));

// Customer interactions (calls, emails, etc.)
export const interactions = pgTable("interactions", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // call, email, meeting, note
  subject: text("subject"),
  content: text("content"),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  contactId: integer("contact_id").references(() => contacts.id),
  userId: integer("user_id").references(() => users.id).notNull(),
  dealId: integer("deal_id").references(() => deals.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const interactionsRelations = relations(interactions, ({ one }) => ({
  customer: one(customers, {
    fields: [interactions.customerId],
    references: [customers.id],
  }),
  contact: one(contacts, {
    fields: [interactions.contactId],
    references: [contacts.id],
  }),
  user: one(users, {
    fields: [interactions.userId],
    references: [users.id],
  }),
  deal: one(deals, {
    fields: [interactions.dealId],
    references: [deals.id],
  }),
}));

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true, createdAt: true, updatedAt: true });
export const insertContactSchema = createInsertSchema(contacts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDealSchema = createInsertSchema(deals)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    // Allow expectedCloseDate to be a string (ISO format) or a Date object
    expectedCloseDate: z.union([
      z.string().transform((val) => new Date(val)),
      z.date(),
      z.null(),
    ]).optional(),
  });
export const insertTaskSchema = createInsertSchema(tasks)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    // Allow dueDate to be a string (ISO format) or a Date object
    dueDate: z.union([
      z.string().transform((val) => new Date(val)),
      z.date(),
      z.null(),
    ]).optional(),
  });
export const insertMeetingSchema = createInsertSchema(meetings)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    // Allow startTime and endTime to be a string (ISO format) or a Date object
    startTime: z.union([
      z.string().transform((val) => new Date(val)),
      z.date(),
    ]),
    endTime: z.union([
      z.string().transform((val) => new Date(val)),
      z.date(),
      z.null(),
    ]).optional(),
  });
export const insertInteractionSchema = createInsertSchema(interactions).omit({ id: true, createdAt: true, updatedAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Customer = typeof customers.$inferSelect & {
  deals?: Deal[];
};
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;

// Base type from Drizzle
export type DealBase = typeof deals.$inferSelect;
// Extended type to include customer information
export type Deal = DealBase & {
  customer?: Customer;
};
export type InsertDeal = z.infer<typeof insertDealSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type Meeting = typeof meetings.$inferSelect;
export type InsertMeeting = z.infer<typeof insertMeetingSchema>;

export type Interaction = typeof interactions.$inferSelect;
export type InsertInteraction = z.infer<typeof insertInteractionSchema>;
