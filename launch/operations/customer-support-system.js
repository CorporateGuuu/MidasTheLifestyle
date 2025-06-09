// Customer Support System for Midas The Lifestyle
// Enterprise-grade customer service platform for luxury clientele

const nodemailer = require('nodemailer');
const twilio = require('twilio');
const { v4: uuidv4 } = require('uuid');

/**
 * Luxury Customer Support System
 * Provides white-glove customer service for elite clientele
 */
class CustomerSupportSystem {
  constructor(config) {
    this.config = config;
    this.tickets = new Map();
    this.agents = new Map();
    this.knowledgeBase = new Map();
    this.chatSessions = new Map();
    this.escalationRules = new Map();
    
    // Initialize communication services
    this.emailTransporter = nodemailer.createTransporter({
      service: 'sendgrid',
      auth: {
        user: 'apikey',
        pass: config.sendgrid.apiKey,
      },
    });
    
    this.twilioClient = twilio(config.twilio.accountSid, config.twilio.authToken);
    
    // Initialize support agents
    this.initializeAgents();
    this.initializeKnowledgeBase();
    this.initializeEscalationRules();
    
    console.log('🎯 Luxury customer support system initialized');
  }

  /**
   * Initialize support agents
   */
  initializeAgents() {
    const agents = [
      {
        id: 'agent-001',
        name: 'Alexandra Sterling',
        role: 'Senior Concierge',
        specialties: ['VIP Services', 'Luxury Vehicles', 'Premium Bookings'],
        languages: ['English', 'French'],
        availability: 'online',
        maxConcurrentChats: 3,
        currentChats: 0,
        rating: 4.9,
        responseTime: 45, // seconds
      },
      {
        id: 'agent-002',
        name: 'Marcus Wellington',
        role: 'Luxury Specialist',
        specialties: ['Exotic Cars', 'Yacht Rentals', 'Corporate Accounts'],
        languages: ['English', 'Spanish'],
        availability: 'online',
        maxConcurrentChats: 3,
        currentChats: 0,
        rating: 4.8,
        responseTime: 60,
      },
      {
        id: 'agent-003',
        name: 'Isabella Rosewood',
        role: 'Premium Support',
        specialties: ['Booking Assistance', 'Payment Issues', 'Technical Support'],
        languages: ['English', 'Italian'],
        availability: 'online',
        maxConcurrentChats: 4,
        currentChats: 0,
        rating: 4.7,
        responseTime: 90,
      },
    ];

    agents.forEach(agent => {
      this.agents.set(agent.id, agent);
    });

    console.log(`👥 Initialized ${agents.length} luxury support agents`);
  }

  /**
   * Initialize knowledge base
   */
  initializeKnowledgeBase() {
    const knowledgeItems = [
      {
        id: 'kb-001',
        category: 'Booking',
        title: 'How to modify a luxury vehicle booking',
        content: 'To modify your booking, please contact our concierge team at least 24 hours before your rental date...',
        tags: ['booking', 'modification', 'luxury-vehicles'],
        priority: 'high',
      },
      {
        id: 'kb-002',
        category: 'Payment',
        title: 'Accepted payment methods for luxury rentals',
        content: 'We accept premium credit cards, wire transfers, and cryptocurrency for qualifying bookings...',
        tags: ['payment', 'methods', 'luxury'],
        priority: 'high',
      },
      {
        id: 'kb-003',
        category: 'Delivery',
        title: 'White-glove delivery service',
        content: 'Our premium delivery service includes vehicle inspection, orientation, and concierge handover...',
        tags: ['delivery', 'white-glove', 'service'],
        priority: 'medium',
      },
      {
        id: 'kb-004',
        category: 'Insurance',
        title: 'Comprehensive luxury vehicle insurance',
        content: 'All rentals include comprehensive insurance coverage with zero deductible for qualifying customers...',
        tags: ['insurance', 'coverage', 'protection'],
        priority: 'high',
      },
    ];

    knowledgeItems.forEach(item => {
      this.knowledgeBase.set(item.id, item);
    });

    console.log(`📚 Initialized knowledge base with ${knowledgeItems.length} articles`);
  }

  /**
   * Initialize escalation rules
   */
  initializeEscalationRules() {
    const rules = [
      {
        id: 'escalation-001',
        trigger: 'vip_customer',
        condition: 'customer.tier === "VIP"',
        action: 'immediate_senior_agent',
        priority: 'critical',
      },
      {
        id: 'escalation-002',
        trigger: 'high_value_booking',
        condition: 'booking.value > 10000',
        action: 'senior_concierge',
        priority: 'high',
      },
      {
        id: 'escalation-003',
        trigger: 'response_time_exceeded',
        condition: 'responseTime > 300',
        action: 'supervisor_notification',
        priority: 'medium',
      },
      {
        id: 'escalation-004',
        trigger: 'complaint_severity',
        condition: 'ticket.severity === "critical"',
        action: 'management_notification',
        priority: 'critical',
      },
    ];

    rules.forEach(rule => {
      this.escalationRules.set(rule.id, rule);
    });

    console.log(`⚡ Initialized ${rules.length} escalation rules`);
  }

  /**
   * Create support ticket
   */
  async createTicket(ticketData) {
    const ticketId = `MIDAS-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    
    const ticket = {
      id: ticketId,
      customerId: ticketData.customerId,
      customerName: ticketData.customerName,
      customerEmail: ticketData.customerEmail,
      customerPhone: ticketData.customerPhone,
      customerTier: ticketData.customerTier || 'standard',
      subject: ticketData.subject,
      description: ticketData.description,
      category: ticketData.category,
      priority: this.calculatePriority(ticketData),
      severity: ticketData.severity || 'medium',
      status: 'open',
      assignedAgent: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      firstResponseTime: null,
      resolutionTime: null,
      customerSatisfaction: null,
      tags: ticketData.tags || [],
      attachments: ticketData.attachments || [],
      history: [{
        timestamp: new Date().toISOString(),
        action: 'ticket_created',
        actor: 'system',
        details: 'Ticket created by customer',
      }],
      relatedBooking: ticketData.bookingId || null,
    };

    this.tickets.set(ticketId, ticket);

    // Auto-assign agent based on priority and specialization
    await this.autoAssignAgent(ticket);

    // Check escalation rules
    await this.checkEscalationRules(ticket);

    // Send confirmation to customer
    await this.sendTicketConfirmation(ticket);

    console.log(`🎫 Created ticket ${ticketId} for ${ticket.customerName}`);
    return ticket;
  }

  /**
   * Calculate ticket priority
   */
  calculatePriority(ticketData) {
    let priority = 'medium';

    // VIP customers get high priority
    if (ticketData.customerTier === 'VIP' || ticketData.customerTier === 'VVIP') {
      priority = 'critical';
    }

    // High-value bookings get elevated priority
    if (ticketData.bookingValue && ticketData.bookingValue > 10000) {
      priority = 'high';
    }

    // Certain categories get elevated priority
    const highPriorityCategories = ['payment_issue', 'booking_emergency', 'vehicle_breakdown'];
    if (highPriorityCategories.includes(ticketData.category)) {
      priority = 'high';
    }

    // Critical issues override everything
    if (ticketData.severity === 'critical') {
      priority = 'critical';
    }

    return priority;
  }

  /**
   * Auto-assign agent to ticket
   */
  async autoAssignAgent(ticket) {
    // Find available agents
    const availableAgents = Array.from(this.agents.values())
      .filter(agent => 
        agent.availability === 'online' && 
        agent.currentChats < agent.maxConcurrentChats
      );

    if (availableAgents.length === 0) {
      console.log('⚠️ No agents available, ticket will be queued');
      return;
    }

    // Score agents based on specialization and workload
    const scoredAgents = availableAgents.map(agent => {
      let score = 0;

      // Specialization match
      if (agent.specialties.some(specialty => 
        ticket.category.toLowerCase().includes(specialty.toLowerCase())
      )) {
        score += 10;
      }

      // VIP customer handling
      if (ticket.customerTier === 'VIP' && agent.role === 'Senior Concierge') {
        score += 15;
      }

      // Lower workload gets higher score
      score += (agent.maxConcurrentChats - agent.currentChats) * 2;

      // Higher rating gets higher score
      score += agent.rating;

      // Faster response time gets higher score
      score += (120 - agent.responseTime) / 10;

      return { agent, score };
    });

    // Sort by score and assign to best agent
    scoredAgents.sort((a, b) => b.score - a.score);
    const bestAgent = scoredAgents[0].agent;

    // Assign ticket
    ticket.assignedAgent = bestAgent.id;
    ticket.updatedAt = new Date().toISOString();
    ticket.history.push({
      timestamp: new Date().toISOString(),
      action: 'agent_assigned',
      actor: 'system',
      details: `Assigned to ${bestAgent.name}`,
    });

    // Update agent workload
    bestAgent.currentChats++;

    // Notify agent
    await this.notifyAgent(bestAgent, ticket);

    console.log(`👤 Assigned ticket ${ticket.id} to ${bestAgent.name}`);
  }

  /**
   * Check escalation rules
   */
  async checkEscalationRules(ticket) {
    for (const rule of this.escalationRules.values()) {
      if (this.evaluateEscalationCondition(rule, ticket)) {
        await this.executeEscalation(rule, ticket);
      }
    }
  }

  /**
   * Evaluate escalation condition
   */
  evaluateEscalationCondition(rule, ticket) {
    switch (rule.trigger) {
      case 'vip_customer':
        return ticket.customerTier === 'VIP' || ticket.customerTier === 'VVIP';
      
      case 'high_value_booking':
        return ticket.relatedBooking && ticket.bookingValue > 10000;
      
      case 'complaint_severity':
        return ticket.severity === 'critical';
      
      default:
        return false;
    }
  }

  /**
   * Execute escalation action
   */
  async executeEscalation(rule, ticket) {
    console.log(`⚡ Executing escalation ${rule.id} for ticket ${ticket.id}`);

    switch (rule.action) {
      case 'immediate_senior_agent':
        await this.assignSeniorAgent(ticket);
        break;
      
      case 'senior_concierge':
        await this.assignSeniorConcierge(ticket);
        break;
      
      case 'supervisor_notification':
        await this.notifySupervisor(ticket);
        break;
      
      case 'management_notification':
        await this.notifyManagement(ticket);
        break;
    }

    ticket.history.push({
      timestamp: new Date().toISOString(),
      action: 'escalation_triggered',
      actor: 'system',
      details: `Escalation rule ${rule.id} executed`,
    });
  }

  /**
   * Start live chat session
   */
  async startChatSession(customerId, customerData) {
    const sessionId = uuidv4();
    
    const session = {
      id: sessionId,
      customerId: customerId,
      customerName: customerData.name,
      customerTier: customerData.tier || 'standard',
      assignedAgent: null,
      status: 'waiting',
      startTime: new Date().toISOString(),
      endTime: null,
      messages: [],
      satisfaction: null,
      tags: [],
    };

    this.chatSessions.set(sessionId, session);

    // Find and assign agent
    await this.assignChatAgent(session);

    console.log(`💬 Started chat session ${sessionId} for ${customerData.name}`);
    return session;
  }

  /**
   * Assign agent to chat session
   */
  async assignChatAgent(session) {
    const availableAgents = Array.from(this.agents.values())
      .filter(agent => 
        agent.availability === 'online' && 
        agent.currentChats < agent.maxConcurrentChats
      )
      .sort((a, b) => {
        // Prioritize by customer tier and agent role
        if (session.customerTier === 'VIP' && a.role === 'Senior Concierge') return -1;
        if (session.customerTier === 'VIP' && b.role === 'Senior Concierge') return 1;
        
        // Then by availability
        return a.currentChats - b.currentChats;
      });

    if (availableAgents.length === 0) {
      session.status = 'queued';
      await this.notifyCustomerQueued(session);
      return;
    }

    const agent = availableAgents[0];
    session.assignedAgent = agent.id;
    session.status = 'active';
    agent.currentChats++;

    // Send welcome message
    await this.sendChatMessage(session.id, {
      sender: 'agent',
      agentId: agent.id,
      agentName: agent.name,
      message: `Hello ${session.customerName}! I'm ${agent.name}, your personal concierge. How may I assist you with your luxury rental experience today?`,
      timestamp: new Date().toISOString(),
    });

    console.log(`💬 Assigned chat ${session.id} to ${agent.name}`);
  }

  /**
   * Send chat message
   */
  async sendChatMessage(sessionId, messageData) {
    const session = this.chatSessions.get(sessionId);
    if (!session) {
      throw new Error('Chat session not found');
    }

    const message = {
      id: uuidv4(),
      ...messageData,
      timestamp: new Date().toISOString(),
    };

    session.messages.push(message);

    // If this is the first agent response, record first response time
    if (messageData.sender === 'agent' && !session.firstResponseTime) {
      session.firstResponseTime = new Date().toISOString();
    }

    // Emit message to connected clients (WebSocket implementation would go here)
    console.log(`💬 Message sent in session ${sessionId}: ${messageData.message}`);

    return message;
  }

  /**
   * Search knowledge base
   */
  searchKnowledgeBase(query, category = null) {
    const results = Array.from(this.knowledgeBase.values())
      .filter(item => {
        const matchesQuery = item.title.toLowerCase().includes(query.toLowerCase()) ||
                           item.content.toLowerCase().includes(query.toLowerCase()) ||
                           item.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()));
        
        const matchesCategory = !category || item.category === category;
        
        return matchesQuery && matchesCategory;
      })
      .sort((a, b) => {
        // Prioritize by priority and relevance
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

    return results;
  }

  /**
   * Generate customer satisfaction survey
   */
  async generateSatisfactionSurvey(ticketId) {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const surveyData = {
      ticketId: ticketId,
      customerEmail: ticket.customerEmail,
      surveyUrl: `https://midasthelifestyle.com/survey/${ticketId}`,
      questions: [
        {
          id: 'overall_satisfaction',
          type: 'rating',
          question: 'How satisfied are you with the resolution of your inquiry?',
          scale: '1-5',
        },
        {
          id: 'agent_performance',
          type: 'rating',
          question: 'How would you rate your assigned concierge\'s performance?',
          scale: '1-5',
        },
        {
          id: 'response_time',
          type: 'rating',
          question: 'How satisfied are you with our response time?',
          scale: '1-5',
        },
        {
          id: 'resolution_quality',
          type: 'rating',
          question: 'How satisfied are you with the quality of the resolution?',
          scale: '1-5',
        },
        {
          id: 'additional_feedback',
          type: 'text',
          question: 'Please share any additional feedback about your experience.',
        },
      ],
    };

    // Send survey email
    await this.sendSatisfactionSurvey(surveyData);

    return surveyData;
  }

  /**
   * Send ticket confirmation email
   */
  async sendTicketConfirmation(ticket) {
    const emailContent = {
      to: ticket.customerEmail,
      subject: `Your Luxury Service Request - Ticket #${ticket.id}`,
      html: this.generateTicketConfirmationEmail(ticket),
    };

    await this.emailTransporter.sendMail({
      from: this.config.email.from,
      ...emailContent,
    });

    console.log(`📧 Sent ticket confirmation to ${ticket.customerEmail}`);
  }

  /**
   * Generate ticket confirmation email template
   */
  generateTicketConfirmationEmail(ticket) {
    return `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FFFFFF;">
        <div style="background: linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%); color: #FFFFFF; padding: 40px 20px; text-align: center;">
          <h1 style="color: #D4AF37; font-family: 'Playfair Display', serif; font-size: 2.5rem; margin: 0;">MIDAS THE LIFESTYLE</h1>
          <p style="color: #CCCCCC; margin: 10px 0 0 0; font-size: 1.1rem;">Luxury Concierge Service</p>
        </div>
        
        <div style="padding: 40px 20px;">
          <h2 style="color: #0A0A0A; margin: 0 0 20px 0;">Thank You for Contacting Us</h2>
          
          <p style="color: #333333; line-height: 1.6; margin-bottom: 30px;">
            Dear ${ticket.customerName},<br><br>
            We have received your luxury service request and our dedicated concierge team is ready to assist you. 
            Your inquiry is important to us, and we are committed to providing you with the exceptional service 
            that defines the Midas experience.
          </p>
          
          <div style="background: #F8F9FA; border-left: 4px solid #D4AF37; padding: 20px; margin: 30px 0;">
            <h3 style="color: #0A0A0A; margin: 0 0 15px 0;">Request Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666666; font-weight: 600;">Ticket Number:</td>
                <td style="padding: 8px 0; color: #0A0A0A; font-family: monospace;">${ticket.id}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666666; font-weight: 600;">Subject:</td>
                <td style="padding: 8px 0; color: #0A0A0A;">${ticket.subject}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666666; font-weight: 600;">Priority:</td>
                <td style="padding: 8px 0; color: #0A0A0A; text-transform: capitalize;">${ticket.priority}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666666; font-weight: 600;">Created:</td>
                <td style="padding: 8px 0; color: #0A0A0A;">${new Date(ticket.createdAt).toLocaleString()}</td>
              </tr>
            </table>
          </div>
          
          <div style="background: #E8F5E8; border-radius: 8px; padding: 20px; margin: 30px 0;">
            <h3 style="color: #2E7D32; margin: 0 0 15px 0;">What Happens Next?</h3>
            <ul style="color: #2E7D32; margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;">Our concierge team will review your request immediately</li>
              <li style="margin-bottom: 8px;">You will receive a personal response within 1 hour</li>
              <li style="margin-bottom: 8px;">We will keep you updated throughout the resolution process</li>
              <li>Your satisfaction is our highest priority</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="https://midasthelifestyle.com/support/ticket/${ticket.id}" 
               style="background: linear-gradient(135deg, #D4AF37 0%, #F4E4BC 100%); 
                      color: #0A0A0A; 
                      text-decoration: none; 
                      padding: 15px 30px; 
                      border-radius: 8px; 
                      font-weight: 600; 
                      display: inline-block;">
              View Ticket Status
            </a>
          </div>
          
          <div style="border-top: 1px solid #E0E0E0; padding-top: 30px; margin-top: 40px;">
            <h3 style="color: #0A0A0A; margin: 0 0 15px 0;">Need Immediate Assistance?</h3>
            <div style="display: flex; justify-content: space-between; flex-wrap: wrap;">
              <div style="margin-bottom: 15px;">
                <strong style="color: #D4AF37;">Phone (USA):</strong><br>
                <a href="tel:+12403510511" style="color: #0A0A0A; text-decoration: none;">+1 240 351 0511</a>
              </div>
              <div style="margin-bottom: 15px;">
                <strong style="color: #D4AF37;">Phone (UAE):</strong><br>
                <a href="tel:+971585531029" style="color: #0A0A0A; text-decoration: none;">+971 58 553 1029</a>
              </div>
              <div style="margin-bottom: 15px;">
                <strong style="color: #D4AF37;">Email:</strong><br>
                <a href="mailto:concierge@midasthelifestyle.com" style="color: #0A0A0A; text-decoration: none;">concierge@midasthelifestyle.com</a>
              </div>
            </div>
          </div>
        </div>
        
        <div style="background: #0A0A0A; color: #CCCCCC; padding: 20px; text-align: center;">
          <p style="margin: 0; font-size: 0.9rem;">
            This is an automated message from Midas The Lifestyle customer service system.<br>
            Please do not reply directly to this email.
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Get support analytics
   */
  getSupportAnalytics() {
    const tickets = Array.from(this.tickets.values());
    const chatSessions = Array.from(this.chatSessions.values());
    const agents = Array.from(this.agents.values());

    return {
      tickets: {
        total: tickets.length,
        open: tickets.filter(t => t.status === 'open').length,
        resolved: tickets.filter(t => t.status === 'resolved').length,
        avgResolutionTime: this.calculateAverageResolutionTime(tickets),
        satisfactionScore: this.calculateAverageSatisfaction(tickets),
        byPriority: {
          critical: tickets.filter(t => t.priority === 'critical').length,
          high: tickets.filter(t => t.priority === 'high').length,
          medium: tickets.filter(t => t.priority === 'medium').length,
          low: tickets.filter(t => t.priority === 'low').length,
        },
      },
      chat: {
        total: chatSessions.length,
        active: chatSessions.filter(s => s.status === 'active').length,
        avgWaitTime: this.calculateAverageWaitTime(chatSessions),
        avgSessionDuration: this.calculateAverageSessionDuration(chatSessions),
      },
      agents: {
        total: agents.length,
        online: agents.filter(a => a.availability === 'online').length,
        avgRating: agents.reduce((sum, a) => sum + a.rating, 0) / agents.length,
        totalActiveChats: agents.reduce((sum, a) => sum + a.currentChats, 0),
      },
    };
  }

  // Placeholder methods for calculations
  calculateAverageResolutionTime(tickets) {
    const resolvedTickets = tickets.filter(t => t.resolutionTime);
    if (resolvedTickets.length === 0) return 0;
    
    const totalTime = resolvedTickets.reduce((sum, ticket) => {
      const created = new Date(ticket.createdAt);
      const resolved = new Date(ticket.resolutionTime);
      return sum + (resolved - created);
    }, 0);
    
    return Math.round(totalTime / resolvedTickets.length / (1000 * 60 * 60)); // hours
  }

  calculateAverageSatisfaction(tickets) {
    const ratedTickets = tickets.filter(t => t.customerSatisfaction);
    if (ratedTickets.length === 0) return 0;
    
    const totalRating = ratedTickets.reduce((sum, ticket) => sum + ticket.customerSatisfaction, 0);
    return (totalRating / ratedTickets.length).toFixed(1);
  }

  calculateAverageWaitTime(sessions) {
    // Implementation would calculate from actual session data
    return 45; // seconds
  }

  calculateAverageSessionDuration(sessions) {
    // Implementation would calculate from actual session data
    return 12; // minutes
  }

  // Placeholder notification methods
  async notifyAgent(agent, ticket) {
    console.log(`📧 Notifying ${agent.name} about ticket ${ticket.id}`);
  }

  async assignSeniorAgent(ticket) {
    console.log(`⬆️ Escalating ticket ${ticket.id} to senior agent`);
  }

  async assignSeniorConcierge(ticket) {
    console.log(`⬆️ Escalating ticket ${ticket.id} to senior concierge`);
  }

  async notifySupervisor(ticket) {
    console.log(`📞 Notifying supervisor about ticket ${ticket.id}`);
  }

  async notifyManagement(ticket) {
    console.log(`🚨 Notifying management about ticket ${ticket.id}`);
  }

  async notifyCustomerQueued(session) {
    console.log(`⏳ Notifying customer ${session.customerId} about queue position`);
  }

  async sendSatisfactionSurvey(surveyData) {
    console.log(`📊 Sending satisfaction survey for ticket ${surveyData.ticketId}`);
  }
}

// Configuration for customer support system
const supportConfig = {
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY,
  },
  
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
  },
  
  email: {
    from: 'concierge@midasthelifestyle.com',
  },
  
  sla: {
    firstResponse: 3600, // 1 hour
    resolution: {
      critical: 14400, // 4 hours
      high: 28800, // 8 hours
      medium: 86400, // 24 hours
      low: 172800, // 48 hours
    },
  },
  
  businessHours: {
    timezone: 'America/New_York',
    weekdays: { start: '08:00', end: '20:00' },
    weekends: { start: '09:00', end: '18:00' },
  },
};

module.exports = {
  CustomerSupportSystem,
  supportConfig,
};
