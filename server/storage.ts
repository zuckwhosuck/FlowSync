import { 
  users, customers, contacts, deals, tasks, meetings, interactions, meetingAttendees,
  type User, type InsertUser, 
  type Customer, type InsertCustomer, 
  type Contact, type InsertContact,
  type Deal, type InsertDeal,
  type Task, type InsertTask,
  type Meeting, type InsertMeeting,
  type Interaction, type InsertInteraction
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, gte, lte, lt, like, desc, sql as sqlBuilder, asc, not, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Customer operations
  getCustomers(limit?: number): Promise<Customer[]>;
  getCustomerById(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<Customer>): Promise<Customer | undefined>;
  deleteCustomer(id: number): Promise<boolean>;
  
  // Contact operations
  getContactsByCustomerId(customerId: number): Promise<Contact[]>;
  getContactById(id: number): Promise<Contact | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: number, contact: Partial<Contact>): Promise<Contact | undefined>;
  deleteContact(id: number): Promise<boolean>;
  
  // Deal operations
  getDeals(): Promise<Deal[]>;
  getDealsByCustomerId(customerId: number): Promise<Deal[]>;
  getDealById(id: number): Promise<Deal | undefined>;
  createDeal(deal: InsertDeal): Promise<Deal>;
  updateDeal(id: number, deal: Partial<Deal>): Promise<Deal | undefined>;
  deleteDeal(id: number): Promise<boolean>;
  getDealsByStage(): Promise<{ stage: string, count: number, totalValue: number }[]>;
  
  // Task operations
  getTasks(): Promise<Task[]>;
  getTasksDueToday(): Promise<Task[]>;
  getTasksByCustomerId(customerId: number): Promise<Task[]>;
  getTasksByDealId(dealId: number): Promise<Task[]>;
  getTaskById(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<Task>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  
  // Meeting operations
  getMeetings(): Promise<Meeting[]>;
  getMeetingsByCustomerId(customerId: number): Promise<Meeting[]>;
  getUpcomingMeetings(): Promise<Meeting[]>;
  getMeetingById(id: number): Promise<Meeting | undefined>;
  createMeeting(meeting: InsertMeeting): Promise<Meeting>;
  updateMeeting(id: number, meeting: Partial<Meeting>): Promise<Meeting | undefined>;
  deleteMeeting(id: number): Promise<boolean>;
  deleteMeetingsByCustomerId(customerId: number): Promise<void>;

  // Interaction operations
  getInteractionsByCustomerId(customerId: number): Promise<Interaction[]>;
  createInteraction(interaction: InsertInteraction): Promise<Interaction>;
  
  // Stats and dashboard operations
  getDashboardStats(): Promise<{
    customerCount: number;
    customerGrowth: number;
    activeDeals: number;
    dealChange: number;
    upcomingMeetings: number;
    meetingChange: number;
    tasksDueToday: number;
    totalTasks: number;
    taskCompletion: number;
    totalSales: number;
    avgDealSize: number;
    winRate: number;
    customerRetentionRate: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.firebaseUid, firebaseUid));
    return user;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [createdUser] = await db.insert(users).values(user).returning();
    return createdUser;
  }

  // Customer operations
  async getCustomers(limit?: number): Promise<Customer[]> {
    console.log("getCustomers called");
    try {
      let baseQuery = db
        .select({
          customer: customers,
          deals: sql<Deal[]>`COALESCE(json_agg(deals.*) FILTER (WHERE deals.id IS NOT NULL), '[]')`.as('deals'),
        })
        .from(customers)
        .leftJoin(deals, eq(customers.id, deals.customerId))
        .groupBy(customers.id)
        .orderBy(desc(customers.updatedAt));

      let query = baseQuery as typeof baseQuery & { limit: (limit: number) => typeof baseQuery }; // Cast the query object

      if (limit) {
        query = (query as any).limit(limit);
      }

      const result: { customer: Customer; deals: Deal[] }[] = await query;

      return result.map((row) => ({
        ...row.customer,
        deals: row.deals,
      }));
    } catch (error) {
      console.error("Error in getCustomers:", error);
      throw error;
    }
  }

  async getCustomerById(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [createdCustomer] = await db.insert(customers).values(customer).returning();
    return createdCustomer;
  }

  async updateCustomer(id: number, customer: Partial<Customer>): Promise<Customer | undefined> {
    console.log(`Storage: Updating customer with ID ${id}`, customer);
    
    try {
      const [updatedCustomer] = await db
        .update(customers)
        .set({ ...customer, updatedAt: new Date() })
        .where(eq(customers.id, id))
        .returning();
      
      console.log(`Storage: Updated customer result:`, updatedCustomer);
      return updatedCustomer;
    } catch (error) {
      console.error(`Storage: Error updating customer with ID ${id}:`, error);
      throw error;
    }
  }

  async deleteCustomer(id: number): Promise<boolean> {
    const [deletedCustomer] = await db
      .delete(customers)
      .where(eq(customers.id, id))
      .returning({ id: customers.id });
    return !!deletedCustomer;
  }

  // Contact operations
  async getContactsByCustomerId(customerId: number): Promise<Contact[]> {
    return db.select().from(contacts).where(eq(contacts.customerId, customerId));
  }

  async getContactById(id: number): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
    return contact;
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const [createdContact] = await db.insert(contacts).values(contact).returning();
    return createdContact;
  }

  async updateContact(id: number, contact: Partial<Contact>): Promise<Contact | undefined> {
    const [updatedContact] = await db
      .update(contacts)
      .set({ ...contact, updatedAt: new Date() })
      .where(eq(contacts.id, id))
      .returning();
    return updatedContact;
  }

  async deleteContact(id: number): Promise<boolean> {
    const [deletedContact] = await db
      .delete(contacts)
      .where(eq(contacts.id, id))
      .returning({ id: contacts.id });
    return !!deletedContact;
  }

  // Deal operations
  async getDeals(): Promise<Deal[]> {
    // Query deals with related customer information
    const rows = await db
      .select()
      .from(deals)
      .leftJoin(customers, eq(deals.customerId, customers.id))
      .orderBy(desc(deals.updatedAt));
    
    // Transform into result with customer property
    return rows.map(row => {
      return {
        ...row.deals,
        customer: row.customers || undefined  // Convert null to undefined
      } as Deal;
    });
  }

  async getDealsByCustomerId(customerId: number): Promise<Deal[]> {
    // Query deals for specific customer with related customer info
    const rows = await db
      .select()
      .from(deals)
      .leftJoin(customers, eq(deals.customerId, customers.id))
      .where(eq(deals.customerId, customerId))
      .orderBy(desc(deals.updatedAt));
    
    // Transform into result with customer property
    return rows.map(row => {
      return {
        ...row.deals,
        customer: row.customers || undefined  // Convert null to undefined
      } as Deal;
    });
  }

  async getDealById(id: number): Promise<Deal | undefined> {
    // Query specific deal with related customer info
    const [row] = await db
      .select()
      .from(deals)
      .leftJoin(customers, eq(deals.customerId, customers.id))
      .where(eq(deals.id, id));
    
    if (!row) return undefined;
    
    // Return deal with customer info
    return {
      ...row.deals,
      customer: row.customers || undefined  // Convert null to undefined
    } as Deal;
  }

  async createDeal(deal: InsertDeal): Promise<Deal> {
    const [createdDeal] = await db.insert(deals).values(deal).returning();
    return createdDeal;
  }

  async updateDeal(id: number, deal: Partial<Deal>): Promise<Deal | undefined> {
    const [updatedDeal] = await db
      .update(deals)
      .set({ ...deal, updatedAt: new Date() })
      .where(eq(deals.id, id))
      .returning();
    return updatedDeal;
  }

  async deleteDeal(id: number): Promise<boolean> {
    const [deletedDeal] = await db
      .delete(deals)
      .where(eq(deals.id, id))
      .returning({ id: deals.id });
    return !!deletedDeal;
  }

  async getDealsByStage(): Promise<{ stage: string, count: number, totalValue: number }[]> {
    const result = await db
      .select({
        stage: deals.stage,
        count: sqlBuilder`count(${deals.id})::int`,
        totalValue: sqlBuilder`COALESCE(sum(${deals.value})::float, 0)`
      })
      .from(deals)
      .groupBy(deals.stage);
    
    return result.map(row => ({
      stage: row.stage,
      count: Number(row.count) || 0,
      totalValue: Number(row.totalValue) || 0
    }));
  }

  // Task operations
  async getTasks(): Promise<Task[]> {
    return db.select().from(tasks).orderBy(asc(tasks.dueDate));
  }

  async getTasksByCustomerId(customerId: number): Promise<Task[]> {
    return db
      .select()
      .from(tasks)
      .where(eq(tasks.customerId, customerId))
      .orderBy(asc(tasks.dueDate));
  }

  async getTasksByDealId(dealId: number): Promise<Task[]> {
    return db
      .select()
      .from(tasks)
      .where(eq(tasks.dealId, dealId))
      .orderBy(asc(tasks.dueDate));
  }

  async getTasksDueToday(): Promise<Task[]> {
    // Create today's date boundaries
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1); // Start of tomorrow
    
    console.log(`Searching for tasks due between ${today.toISOString()} and ${tomorrow.toISOString()}`);
    
    return db
      .select()
      .from(tasks)
      .where(
        and(
          // Greater than or equal to start of today
          gte(tasks.dueDate, today),
          // Less than start of tomorrow
          lt(tasks.dueDate, tomorrow),
          // Not completed or cancelled
          not(eq(tasks.status, 'completed')),
          not(eq(tasks.status, 'cancelled'))
        )
      )
      .orderBy(asc(tasks.dueDate));
  }

  async getTaskById(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [createdTask] = await db.insert(tasks).values(task).returning();
    return createdTask;
  }

  async updateTask(id: number, task: Partial<Task>): Promise<Task | undefined> {
    const [updatedTask] = await db
      .update(tasks)
      .set({ ...task, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return updatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    const [deletedTask] = await db
      .delete(tasks)
      .where(eq(tasks.id, id))
      .returning({ id: tasks.id });
    return !!deletedTask;
  }

  // Meeting operations
  async getMeetings(): Promise<Meeting[]> {
    return db.select().from(meetings).orderBy(asc(meetings.startTime));
  }
  
  async getMeetingsByCustomerId(customerId: number): Promise<Meeting[]> {
    return db
      .select()
      .from(meetings)
      .where(eq(meetings.customerId, customerId))
      .orderBy(asc(meetings.startTime));
  }

  async getUpcomingMeetings(): Promise<Meeting[]> {
    const now = new Date();
    
    return db
      .select()
      .from(meetings)
      .where(
        and(
          gte(meetings.startTime, now),
          eq(meetings.status, 'scheduled')
        )
      )
      .orderBy(asc(meetings.startTime));
  }

  async getMeetingById(id: number): Promise<Meeting | undefined> {
    const [meeting] = await db.select().from(meetings).where(eq(meetings.id, id));
    return meeting;
  }

  async createMeeting(meeting: InsertMeeting): Promise<Meeting> {
    const [createdMeeting] = await db.insert(meetings).values(meeting).returning();
    return createdMeeting;
  }

  async updateMeeting(id: number, meeting: Partial<Meeting>): Promise<Meeting | undefined> {
    const [updatedMeeting] = await db
      .update(meetings)
      .set({ ...meeting, updatedAt: new Date() })
      .where(eq(meetings.id, id))
      .returning();
    return updatedMeeting;
  }

  async deleteMeeting(id: number): Promise<boolean> {
    const [deletedMeeting] = await db
      .delete(meetings)
      .where(eq(meetings.id, id))
      .returning({ id: meetings.id });
    return !!deletedMeeting;
  }

  async deleteMeetingsByCustomerId(customerId: number): Promise<void> {
    await db.delete(meetings).where(eq(meetings.customerId, customerId));
  }

  // Interaction operations
  async getInteractionsByCustomerId(customerId: number): Promise<Interaction[]> {
    return db
      .select()
      .from(interactions)
      .where(eq(interactions.customerId, customerId))
      .orderBy(desc(interactions.createdAt));
  }

  async createInteraction(interaction: InsertInteraction): Promise<Interaction> {
    const [createdInteraction] = await db.insert(interactions).values(interaction).returning();
    return createdInteraction;
  }

  // Stats and dashboard operations
  async getDashboardStats(): Promise<{
    customerCount: number;
    customerGrowth: number;
    activeDeals: number;
    dealChange: number;
    upcomingMeetings: number;
    meetingChange: number;
    tasksDueToday: number;
    totalTasks: number;
    taskCompletion: number;
    totalSales: number;
    avgDealSize: number;
    winRate: number;
    customerRetentionRate: number;
  }> {
    // Get customer count
    const [customerCountResult] = await db
      .select({ count: sqlBuilder`count(*)::int` })
      .from(customers);

    // Calculate total sales
    const [totalSalesResult] = await db
      .select({ value: sqlBuilder`COALESCE(sum(${deals.value})::float, 0)` })
      .from(deals)

    const totalSales = Number(totalSalesResult?.value) || 0;
    
    // Calculate average deal size
    const [totalDealsResult] = await db
      .select({ count: sqlBuilder`count(*)::int` })
      .from(deals);

    const totalDeals = Number(totalDealsResult?.count) || 0;
    const avgDealSize = totalDeals === 0 ? 0 : totalSales / totalDeals;

    // Calculate win rate
    const [wonDealsResult] = await db
      .select({ count: sqlBuilder`count(*)::int` })
      .from(deals)
      .where(eq(deals.stage, 'closed_won'));

    const wonDeals = Number(wonDealsResult?.count) || 0;
    const winRate = totalDeals === 0 ? 0 : (wonDeals / totalDeals) * 100;
    
    // Get customer growth (compare current month to previous month)
    const now = new Date();
    const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    
    const [currentMonthCustomers] = await db
      .select({ count: sqlBuilder`count(*)::int` })
      .from(customers)
      .where(gte(customers.createdAt, firstDayCurrentMonth));
    
    const [previousMonthCustomers] = await db
      .select({ count: sqlBuilder`count(*)::int` })
      .from(customers)
      .where(
        and(
          gte(customers.createdAt, firstDayPreviousMonth),
          lte(customers.createdAt, lastDayPreviousMonth)
        )
      );
    
    const currentCount = Number(currentMonthCustomers.count) || 0;
    const previousCount = Number(previousMonthCustomers.count) || 0;
    const customerGrowth = previousCount === 0 
      ? 0 
      : ((currentCount - previousCount) / previousCount) * 100;
    
    // Calculate Customer Retention Rate (CRR)
    const endCustomers = Number(customerCountResult.count) || 0;
    const newCustomers = currentCount;
    const startingCustomers = endCustomers - newCustomers;
    const customerRetentionRate = startingCustomers === 0
      ? 0
      : ((endCustomers - newCustomers) / startingCustomers) * 100;

    
    // Get active deals
    const [activeDealsResult] = await db
      .select({ count: sqlBuilder`count(*)::int` })
      .from(deals)
      .where(
        or(
          eq(deals.stage, 'lead'),
          eq(deals.stage, 'qualification'),
          eq(deals.stage, 'proposal'),
          eq(deals.stage, 'negotiation')
        )
      );
    
    // Get deal change (compare current month to previous month)
    const [currentMonthDeals] = await db
      .select({ count: sqlBuilder`count(*)::int` })
      .from(deals)
      .where(gte(deals.createdAt, firstDayCurrentMonth));
    
    const [previousMonthDeals] = await db
      .select({ count: sqlBuilder`count(*)::int` })
      .from(deals)
      .where(
        and(
          gte(deals.createdAt, firstDayPreviousMonth),
          lte(deals.createdAt, lastDayPreviousMonth)
        )
      );
    
    const currentDealCount = Number(currentMonthDeals.count) || 0;
    const previousDealCount = Number(previousMonthDeals.count) || 0;
    const dealChange = previousDealCount === 0 
      ? 0 
      : ((currentDealCount - previousDealCount) / previousDealCount) * 100;
    
    // Get upcoming meetings
    const [upcomingMeetingsResult] = await db
      .select({ count: sqlBuilder`count(*)::int` })
      .from(meetings)
      .where(
        and(
          gte(meetings.startTime, now),
          eq(meetings.status, 'scheduled')
        )
      );
    
    // Get meeting change (compare current month to previous month)
    const [currentMonthMeetings] = await db
      .select({ count: sqlBuilder`count(*)::int` })
      .from(meetings)
      .where(gte(meetings.createdAt, firstDayCurrentMonth));
    
    const [previousMonthMeetings] = await db
      .select({ count: sqlBuilder`count(*)::int` })
      .from(meetings)
      .where(
        and(
          gte(meetings.createdAt, firstDayPreviousMonth),
          lte(meetings.createdAt, lastDayPreviousMonth)
        )
      );
    
    const currentMeetingCount = Number(currentMonthMeetings.count) || 0;
    const previousMeetingCount = Number(previousMonthMeetings.count) || 0;
    const meetingChange = previousMeetingCount === 0 
      ? 0 
      : ((currentMeetingCount - previousMeetingCount) / previousMeetingCount) * 100;
    
    // Get tasks due today using the same boundaries as getTasksDueToday
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0); // Start of today
    const tomorrowDate = new Date(todayDate);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1); // Start of tomorrow
    
    const [tasksDueTodayResult] = await db
      .select({ count: sqlBuilder`count(*)::int` })
      .from(tasks)
      .where(
        and(
          // Greater than or equal to start of today
          gte(tasks.dueDate, todayDate),
          // Less than start of tomorrow
          lt(tasks.dueDate, tomorrowDate),
          // Not completed or cancelled
          not(eq(tasks.status, 'completed')),
          not(eq(tasks.status, 'cancelled'))
        )
      );
    
    // Calculate task completion percentage
    const [completedTasksResult] = await db
      .select({ count: sqlBuilder`count(*)::int` })
      .from(tasks)
      .where(eq(tasks.status, 'completed'));
    
    const [totalTasksResult] = await db
      .select({ count: sqlBuilder`count(*)::int` })
      .from(tasks);
    
    const completedTasks = Number(completedTasksResult.count) || 0;
    const totalTasks = Number(totalTasksResult.count) || 0;
    const taskCompletion = totalTasks === 0 
      ? 0 
      : (completedTasks / totalTasks) * 100;
    
    return {
      customerCount: Number(customerCountResult.count) || 0,
      customerGrowth: parseFloat(customerGrowth.toFixed(1)),
      activeDeals: Number(activeDealsResult.count) || 0,
      dealChange: parseFloat(dealChange.toFixed(1)),
      upcomingMeetings: Number(upcomingMeetingsResult.count) || 0,
      meetingChange: parseFloat(meetingChange.toFixed(1)),
      tasksDueToday: Number(tasksDueTodayResult.count) || 0,
      totalTasks: totalTasks,
      taskCompletion: parseFloat(taskCompletion.toFixed(1)),
      totalSales: parseFloat(totalSales.toFixed(2)),
      avgDealSize: parseFloat(avgDealSize.toFixed(2)),
      winRate: parseFloat(winRate.toFixed(1)),
      customerRetentionRate: parseFloat(customerRetentionRate.toFixed(1)),
    };
  }
}

export const storage = new DatabaseStorage();
