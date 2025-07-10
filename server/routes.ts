import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema,
  insertCustomerSchema,
  insertContactSchema,
  insertDealSchema,
  insertTaskSchema,
  insertMeetingSchema,
  insertInteractionSchema
} from "@shared/schema";
import { ZodError } from "zod";

// Middleware for handling validation errors
const handleValidationError = (err: any, res: Response) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: 'Validation error',
      errors: err.errors,
    });
  }
  return res.status(500).json({ message: err.message || 'Internal server error' });
};

// Development mode flag - set to true for development purposes
const DEV_MODE = true;

// Middleware to check if user is authenticated
const requireAuth = async (req: Request, res: Response, next: Function) => {
  // In development mode, allow demo user to access without proper auth
  if (DEV_MODE && req.headers['x-dev-mode'] === 'true') {
    try {
      // Get or create demo user
      let user = await storage.getUserByFirebaseUid('demo-user-123');
      
      if (!user) {
        // Create demo user if it doesn't exist
        console.log('Creating demo user for development');
        user = await storage.createUser({
          email: "demo@example.com",
          displayName: "Demo User",
          photoURL: "https://ui-avatars.com/api/?name=Demo+User&background=random",
          firebaseUid: "demo-user-123",
          role: 'admin'
        });
      }
      
      // Add user to request object
      (req as any).user = user;
      return next();
    } catch (error) {
      console.error('Demo auth error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
  
  // Regular authentication for production
  const firebaseUid = req.headers['x-firebase-uid'] as string;
  
  if (!firebaseUid) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  try {
    const user = await storage.getUserByFirebaseUid(firebaseUid);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Add user to request object for use in route handlers
    (req as any).user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes - all prefixed with /api
  
  // Auth routes
  app.post('/api/auth/user', async (req: Request, res: Response) => {
    try {
      // Handle development mode - allow demo user creation
      if (DEV_MODE && (req.headers['x-dev-mode'] === 'true' || req.body.firebaseUid === 'demo-user-123')) {
        // Check if the demo user already exists
        let user = await storage.getUserByFirebaseUid('demo-user-123');
        
        if (user) {
          return res.json(user);
        }
        
        // Create demo user
        const userData = insertUserSchema.parse({
          email: req.body.email || "demo@example.com",
          displayName: req.body.displayName || "Demo User",
          photoURL: req.body.photoURL || "https://ui-avatars.com/api/?name=Demo+User&background=random",
          firebaseUid: 'demo-user-123',
          role: 'admin'
        });
        
        user = await storage.createUser(userData);
        return res.status(201).json(user);
      }
      
      // Regular production flow
      const firebaseUid = req.headers['x-firebase-uid'] as string;
      
      if (!firebaseUid) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      // Check if user exists
      let user = await storage.getUserByFirebaseUid(firebaseUid);
      
      if (user) {
        return res.json(user);
      }
      
      // Create new user if not exists
      const userData = insertUserSchema.parse({
        email: req.body.email,
        displayName: req.body.displayName,
        photoURL: req.body.photoURL,
        firebaseUid: firebaseUid,
        role: 'user'
      });
      
      user = await storage.createUser(userData);
      return res.status(201).json(user);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });
  
  // Dashboard stats
  app.get('/api/dashboard/stats', requireAuth, async (req: Request, res: Response) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      res.status(500).json({ message: 'Error fetching dashboard stats' });
    }
  });
  
  // Customer routes
  app.get('/api/customers', requireAuth, async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const customers = await storage.getCustomers(limit);
      res.json(customers);
    } catch (err) {
      console.error('Error fetching customers:', err);
      res.status(500).json({ message: 'Error fetching customers' });
    }
  });
  
  app.get('/api/customers/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const customer = await storage.getCustomerById(parseInt(req.params.id));
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      res.json(customer);
    } catch (err) {
      console.error('Error fetching customer:', err);
      res.status(500).json({ message: 'Error fetching customer' });
    }
  });
  
  app.post('/api/customers', requireAuth, async (req: Request, res: Response) => {
    try {
      const customerData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(customerData);
      res.status(201).json(customer);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });
  
  app.put('/api/customers/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`Received update request for customer ID: ${id}`, req.body);
      
      const customerData = insertCustomerSchema.partial().parse(req.body);
      console.log("Validated customer data:", customerData);
      
      const customer = await storage.updateCustomer(id, customerData);
      console.log("Update result:", customer);
      
      if (!customer) {
        console.error(`Customer ID ${id} not found for update`);
        return res.status(404).json({ message: 'Customer not found' });
      }
      
      res.json(customer);
    } catch (err) {
      console.error(`Error updating customer:`, err);
      return handleValidationError(err, res);
    }
  });
  
  app.delete('/api/customers/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      // Delete meetings associated with the customer
      await storage.deleteMeetingsByCustomerId(id);
  
      const success = await storage.deleteCustomer(id);
      
      if (!success) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      
      res.status(204).end();
    } catch (err) {
      console.error('Error deleting customer:', err);
      res.status(500).json({ message: 'Error deleting customer' });
    }
  });
  
  // Contact routes
  app.get('/api/customers/:customerId/contacts', requireAuth, async (req: Request, res: Response) => {
    try {
      const customerId = parseInt(req.params.customerId);
      const contacts = await storage.getContactsByCustomerId(customerId);
      res.json(contacts);
    } catch (err) {
      console.error('Error fetching contacts:', err);
      res.status(500).json({ message: 'Error fetching contacts' });
    }
  });
  
  app.post('/api/contacts', requireAuth, async (req: Request, res: Response) => {
    try {
      const contactData = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(contactData);
      res.status(201).json(contact);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });
  
  app.put('/api/contacts/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const contactData = insertContactSchema.partial().parse(req.body);
      const contact = await storage.updateContact(id, contactData);
      
      if (!contact) {
        return res.status(404).json({ message: 'Contact not found' });
      }
      
      res.json(contact);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });
  
  app.delete('/api/contacts/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteContact(id);
      
      if (!success) {
        return res.status(404).json({ message: 'Contact not found' });
      }
      
      res.status(204).end();
    } catch (err) {
      console.error('Error deleting contact:', err);
      res.status(500).json({ message: 'Error deleting contact' });
    }
  });
  
  // Deal routes
  app.get('/api/deals', requireAuth, async (req: Request, res: Response) => {
    try {
      const deals = await storage.getDeals();
      res.json(deals);
    } catch (err) {
      console.error('Error fetching deals:', err);
      res.status(500).json({ message: 'Error fetching deals' });
    }
  });
  
  app.get('/api/deals/by-stage', requireAuth, async (req: Request, res: Response) => {
    try {
      const dealsByStage = await storage.getDealsByStage();
      res.json(dealsByStage);
    } catch (err) {
      console.error('Error fetching deals by stage:', err);
      res.status(500).json({ message: 'Error fetching deals by stage' });
    }
  });
  
  app.get('/api/deals/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const deal = await storage.getDealById(id);
      
      if (!deal) {
        return res.status(404).json({ message: 'Deal not found' });
      }
      
      res.json(deal);
    } catch (err) {
      console.error('Error fetching deal:', err);
      res.status(500).json({ message: 'Error fetching deal' });
    }
  });
  
  app.get('/api/customers/:customerId/deals', requireAuth, async (req: Request, res: Response) => {
    try {
      const customerId = parseInt(req.params.customerId);
      const deals = await storage.getDealsByCustomerId(customerId);
      res.json(deals);
    } catch (err) {
      console.error('Error fetching deals for customer:', err);
      res.status(500).json({ message: 'Error fetching deals for customer' });
    }
  });
  
  app.post('/api/deals', requireAuth, async (req: Request, res: Response) => {
    try {
      const dealData = insertDealSchema.parse(req.body);
      const deal = await storage.createDeal(dealData);
      res.status(201).json(deal);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });
  
  app.put('/api/deals/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const dealData = insertDealSchema.partial().parse(req.body);
      const deal = await storage.updateDeal(id, dealData);
      
      if (!deal) {
        return res.status(404).json({ message: 'Deal not found' });
      }
      
      res.json(deal);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });
  
  app.delete('/api/deals/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteDeal(id);
      
      if (!success) {
        return res.status(404).json({ message: 'Deal not found' });
      }
      
      res.status(204).end();
    } catch (err) {
      console.error('Error deleting deal:', err);
      res.status(500).json({ message: 'Error deleting deal' });
    }
  });
  
  // Task routes
  app.get('/api/tasks', requireAuth, async (req: Request, res: Response) => {
    try {
      const tasks = await storage.getTasks();
      res.json(tasks);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      res.status(500).json({ message: 'Error fetching tasks' });
    }
  });
  
  app.get('/api/tasks/due-today', requireAuth, async (req: Request, res: Response) => {
    try {
      const tasks = await storage.getTasksDueToday();
      res.json(tasks);
    } catch (err) {
      console.error('Error fetching tasks due today:', err);
      res.status(500).json({ message: 'Error fetching tasks due today' });
    }
  });
  
  // Get tasks by customer ID
  app.get('/api/customers/:customerId/tasks', requireAuth, async (req: Request, res: Response) => {
    try {
      const customerId = parseInt(req.params.customerId);
      const tasks = await storage.getTasksByCustomerId(customerId);
      res.json(tasks);
    } catch (err) {
      console.error('Error fetching customer tasks:', err);
      res.status(500).json({ message: 'Error fetching customer tasks' });
    }
  });
  
  // Get a single task by ID
  app.get('/api/tasks/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.id);
      const task = await storage.getTaskById(taskId);
      
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
      
      res.json(task);
    } catch (err) {
      console.error('Error fetching task:', err);
      res.status(500).json({ message: 'Error fetching task' });
    }
  });
  
  // Get tasks by deal ID
  app.get('/api/deals/:dealId/tasks', requireAuth, async (req: Request, res: Response) => {
    try {
      const dealId = parseInt(req.params.dealId);
      const tasks = await storage.getTasksByDealId(dealId);
      res.json(tasks);
    } catch (err) {
      console.error('Error fetching deal tasks:', err);
      res.status(500).json({ message: 'Error fetching deal tasks' });
    }
  });
  
  app.post('/api/tasks', requireAuth, async (req: Request, res: Response) => {
    try {
      const taskData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(taskData);
      res.status(201).json(task);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });
  
  app.put('/api/tasks/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const taskData = insertTaskSchema.partial().parse(req.body);
      const task = await storage.updateTask(id, taskData);
      
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
      
      res.json(task);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });
  
  app.delete('/api/tasks/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteTask(id);
      
      if (!success) {
        return res.status(404).json({ message: 'Task not found' });
      }
      
      res.status(204).end();
    } catch (err) {
      console.error('Error deleting task:', err);
      res.status(500).json({ message: 'Error deleting task' });
    }
  });
  
  // Meeting routes
  app.get('/api/meetings', requireAuth, async (req: Request, res: Response) => {
    try {
      const meetings = await storage.getMeetings();
      res.json(meetings);
    } catch (err) {
      console.error('Error fetching meetings:', err);
      res.status(500).json({ message: 'Error fetching meetings' });
    }
  });
  
  app.get('/api/customers/:customerId/meetings', requireAuth, async (req: Request, res: Response) => {
    try {
      const customerId = parseInt(req.params.customerId);
      const meetings = await storage.getMeetingsByCustomerId(customerId);
      res.json(meetings);
    } catch (err) {
      console.error('Error fetching customer meetings:', err);
      res.status(500).json({ message: 'Error fetching customer meetings' });
    }
  });
  
  app.get('/api/meetings/upcoming', requireAuth, async (req: Request, res: Response) => {
    try {
      const meetings = await storage.getUpcomingMeetings();
      res.json(meetings);
    } catch (err) {
      console.error('Error fetching upcoming meetings:', err);
      res.status(500).json({ message: 'Error fetching upcoming meetings' });
    }
  });
  
  app.post('/api/meetings', requireAuth, async (req: Request, res: Response) => {
    try {
      const meetingData = insertMeetingSchema.parse(req.body);
      const meeting = await storage.createMeeting(meetingData);
      res.status(201).json(meeting);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });
  
  app.put('/api/meetings/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const meetingData = insertMeetingSchema.partial().parse(req.body);
      const meeting = await storage.updateMeeting(id, meetingData);
      
      if (!meeting) {
        return res.status(404).json({ message: 'Meeting not found' });
      }
      
      res.json(meeting);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });
  
  app.delete('/api/meetings/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteMeeting(id);
      
      if (!success) {
        return res.status(404).json({ message: 'Meeting not found' });
      }
      
      res.status(204).end();
    } catch (err) {
      console.error('Error deleting meeting:', err);
      res.status(500).json({ message: 'Error deleting meeting' });
    }
  });
  
  // Interaction routes
  app.get('/api/customers/:customerId/interactions', requireAuth, async (req: Request, res: Response) => {
    try {
      const customerId = parseInt(req.params.customerId);
      const interactions = await storage.getInteractionsByCustomerId(customerId);
      res.json(interactions);
    } catch (err) {
      console.error('Error fetching interactions:', err);
      res.status(500).json({ message: 'Error fetching interactions' });
    }
  });
  
  app.post('/api/interactions', requireAuth, async (req: Request, res: Response) => {
    try {
      const interactionData = insertInteractionSchema.parse(req.body);
      const interaction = await storage.createInteraction(interactionData);
      res.status(201).json(interaction);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
