// AI Chatbot for Midas The Lifestyle
// Intelligent customer service assistant

class AIChatbot {
  constructor() {
    this.isOpen = false;
    this.conversationHistory = [];
    this.knowledgeBase = this.initializeKnowledgeBase();
    this.init();
  }

  // Initialize chatbot
  init() {
    this.setupEventListeners();
    console.log('🤖 AI Chatbot initialized');
  }

  // Initialize knowledge base
  initializeKnowledgeBase() {
    return {
      greetings: [
        "Hello! Welcome to Midas The Lifestyle. How may I assist you today?",
        "Greetings! I'm your AI concierge. What luxury service can I help you with?",
        "Welcome! I'm here to help you with our exclusive luxury offerings."
      ],
      
      services: {
        cars: {
          keywords: ['car', 'vehicle', 'drive', 'rental', 'hypercar', 'luxury car', 'automobile'],
          response: "Our luxury car collection includes hypercars like Bugatti Chiron and Koenigsegg Jesko, luxury sedans like Rolls-Royce Phantom, and premium SUVs like Cullinan. Prices start from AED 2,500/day. Would you like to see our full collection or book a specific vehicle?"
        },
        
        yachts: {
          keywords: ['yacht', 'boat', 'charter', 'marine', 'superyacht', 'sailing'],
          response: "We offer exclusive superyacht charters including mega yachts and luxury motor yachts. Our fleet features vessels from 50ft to 280ft with full crew and amenities. Charters start from AED 15,000/day. Would you like information about a specific yacht or charter package?"
        },
        
        jets: {
          keywords: ['jet', 'plane', 'flight', 'aviation', 'private jet', 'aircraft'],
          response: "Our private jet fleet includes light jets, heavy jets, and ultra-long-range aircraft like the Gulfstream G700. Perfect for business or leisure travel with complete privacy and luxury. Pricing varies by route and aircraft. Shall I help you plan a flight?"
        },
        
        properties: {
          keywords: ['property', 'estate', 'villa', 'penthouse', 'mansion', 'real estate'],
          response: "We offer exclusive luxury properties including waterfront villas, penthouse suites, and private estates in Dubai, Washington DC, Atlanta, and other premium locations. Nightly rates start from AED 3,500. Would you like to see available properties for specific dates?"
        },
        
        transportation: {
          keywords: ['chauffeur', 'driver', 'transport', 'transfer', 'airport', 'limousine'],
          response: "Our luxury transportation services include professional chauffeur services with Mercedes S-Class and BMW 7 Series vehicles, airport transfers, and estate transportation. Available in Dubai, Washington DC, Atlanta, and surrounding areas. Hourly rates start from AED 450. How can I assist with your transportation needs?"
        }
      },
      
      locations: {
        keywords: ['dubai', 'washington', 'atlanta', 'maryland', 'virginia', 'uae', 'dc', 'location'],
        response: "Midas The Lifestyle operates in Dubai & UAE, Washington DC Metro area, Northern Virginia, Maryland, and Atlanta GA. Each location offers our full range of luxury services with local expertise. Which location interests you?"
      },
      
      booking: {
        keywords: ['book', 'reserve', 'availability', 'schedule', 'appointment', 'rental'],
        response: "I can help you start the booking process! Our advanced booking system allows you to check real-time availability, select dates, and complete secure payments. Would you like me to open the booking calendar for a specific service?"
      },
      
      pricing: {
        keywords: ['price', 'cost', 'rate', 'fee', 'expensive', 'cheap', 'budget'],
        response: "Our pricing varies by service and location. Luxury cars start from AED 2,500/day, yachts from AED 15,000/day, private jets are quoted per trip, and properties from AED 3,500/night. All prices include premium service and support. Would you like detailed pricing for a specific service?"
      },
      
      contact: {
        keywords: ['contact', 'phone', 'email', 'support', 'help', 'concierge'],
        response: "You can reach our VVIP concierge team 24/7 at +971 123 456 789 or concierge@midasthelifestyle.com. For immediate assistance, I'm here to help, or you can use our WhatsApp chat. What would you prefer?"
      }
    };
  }

  // Setup event listeners
  setupEventListeners() {
    // Initialize on page load
    document.addEventListener('DOMContentLoaded', () => {
      this.initializeChatInterface();
    });
  }

  // Initialize chat interface
  initializeChatInterface() {
    // The HTML is already in the page, just need to set up functionality
    console.log('Chat interface ready');
  }

  // Toggle chatbot window
  toggleChatbot() {
    const chatbotWindow = document.getElementById('chatbot-window');
    const chatbotToggle = document.getElementById('chatbot-toggle');
    
    this.isOpen = !this.isOpen;
    
    if (this.isOpen) {
      chatbotWindow.classList.add('active');
      chatbotToggle.classList.add('active');
      
      // Focus on input
      setTimeout(() => {
        document.getElementById('chatbot-input-field').focus();
      }, 300);
    } else {
      chatbotWindow.classList.remove('active');
      chatbotToggle.classList.remove('active');
    }
  }

  // Handle keypress in input field
  handleChatbotKeypress(event) {
    if (event.key === 'Enter') {
      this.sendChatbotMessage();
    }
  }

  // Send chatbot message
  sendChatbotMessage() {
    const inputField = document.getElementById('chatbot-input-field');
    const message = inputField.value.trim();
    
    if (!message) return;
    
    // Add user message to chat
    this.addMessageToChat(message, 'user');
    
    // Clear input
    inputField.value = '';
    
    // Process message and respond
    setTimeout(() => {
      const response = this.processMessage(message);
      this.addMessageToChat(response, 'bot');
    }, 500);
  }

  // Send quick message
  sendQuickMessage(message) {
    this.addMessageToChat(message, 'user');
    
    setTimeout(() => {
      const response = this.processMessage(message);
      this.addMessageToChat(response, 'bot');
    }, 500);
  }

  // Add message to chat
  addMessageToChat(message, sender) {
    const messagesContainer = document.getElementById('chatbot-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageDiv.innerHTML = `
      <div class="message-content">${message}</div>
      <div class="message-time">${timeString}</div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Store in conversation history
    this.conversationHistory.push({
      message: message,
      sender: sender,
      timestamp: now
    });
  }

  // Process user message and generate response
  processMessage(message) {
    const lowerMessage = message.toLowerCase();
    
    // Check for greetings
    if (this.isGreeting(lowerMessage)) {
      return this.getRandomGreeting();
    }
    
    // Check for service-related queries
    for (const [serviceKey, serviceData] of Object.entries(this.knowledgeBase.services)) {
      if (serviceData.keywords.some(keyword => lowerMessage.includes(keyword))) {
        return serviceData.response;
      }
    }
    
    // Check for location queries
    if (this.knowledgeBase.locations.keywords.some(keyword => lowerMessage.includes(keyword))) {
      return this.knowledgeBase.locations.response;
    }
    
    // Check for booking queries
    if (this.knowledgeBase.booking.keywords.some(keyword => lowerMessage.includes(keyword))) {
      return this.knowledgeBase.booking.response;
    }
    
    // Check for pricing queries
    if (this.knowledgeBase.pricing.keywords.some(keyword => lowerMessage.includes(keyword))) {
      return this.knowledgeBase.pricing.response;
    }
    
    // Check for contact queries
    if (this.knowledgeBase.contact.keywords.some(keyword => lowerMessage.includes(keyword))) {
      return this.knowledgeBase.contact.response;
    }
    
    // Handle specific luxury items
    if (lowerMessage.includes('bugatti') || lowerMessage.includes('chiron')) {
      return "The Bugatti Chiron is one of our flagship hypercars, featuring 1,479 HP and a top speed of 420 km/h. Available for AED 20,000/day in Dubai and other locations. Would you like to check availability or book a viewing?";
    }
    
    if (lowerMessage.includes('rolls royce') || lowerMessage.includes('phantom')) {
      return "The Rolls-Royce Phantom represents the pinnacle of luxury sedans. Perfect for special occasions and VIP transport. Available from AED 3,500/day. Shall I check availability for your preferred dates?";
    }
    
    // Handle complex queries that might need human assistance
    if (this.isComplexQuery(lowerMessage)) {
      return "This is a detailed inquiry that would benefit from our human concierge expertise. I can connect you with our VVIP team immediately via WhatsApp (+971 123 456 789) or email (concierge@midasthelifestyle.com). They'll provide personalized assistance within minutes. Would you prefer WhatsApp or email contact?";
    }
    
    // Default response for unrecognized queries
    return "I'd be happy to help you with that! For the most accurate information about our luxury services, I can connect you with our VVIP concierge team. You can also ask me about our cars, yachts, jets, properties, or transportation services. What specific service interests you most?";
  }

  // Check if message is a greeting
  isGreeting(message) {
    const greetingWords = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'greetings'];
    return greetingWords.some(greeting => message.includes(greeting));
  }

  // Get random greeting
  getRandomGreeting() {
    const greetings = this.knowledgeBase.greetings;
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  // Check if query is complex and needs human assistance
  isComplexQuery(message) {
    const complexIndicators = [
      'custom', 'special request', 'multiple', 'package', 'discount', 'negotiation',
      'corporate', 'event planning', 'wedding', 'celebration', 'group booking',
      'long term', 'monthly', 'annual', 'contract', 'partnership'
    ];
    
    return complexIndicators.some(indicator => message.includes(indicator)) || message.length > 100;
  }

  // Open WhatsApp chat
  openWhatsAppChat() {
    const phoneNumber = '971123456789'; // Replace with actual WhatsApp business number
    const message = encodeURIComponent('Hello! I\'m interested in Midas The Lifestyle luxury services.');
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  }

  // Get conversation history
  getConversationHistory() {
    return this.conversationHistory;
  }

  // Clear conversation
  clearConversation() {
    this.conversationHistory = [];
    const messagesContainer = document.getElementById('chatbot-messages');
    messagesContainer.innerHTML = `
      <div class="message bot-message">
        <div class="message-content">
          Welcome to Midas The Lifestyle! I'm your AI concierge. How may I assist you with our luxury services today?
        </div>
        <div class="message-time">Just now</div>
      </div>
    `;
  }
}

// Global functions for HTML onclick events
function toggleChatbot() {
  if (window.aiChatbot) {
    window.aiChatbot.toggleChatbot();
  }
}

function handleChatbotKeypress(event) {
  if (window.aiChatbot) {
    window.aiChatbot.handleChatbotKeypress(event);
  }
}

function sendChatbotMessage() {
  if (window.aiChatbot) {
    window.aiChatbot.sendChatbotMessage();
  }
}

function sendQuickMessage(message) {
  if (window.aiChatbot) {
    window.aiChatbot.sendQuickMessage(message);
  }
}

function openWhatsAppChat() {
  if (window.aiChatbot) {
    window.aiChatbot.openWhatsAppChat();
  }
}

// Initialize AI chatbot
const aiChatbot = new AIChatbot();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIChatbot;
} else {
  window.AIChatbot = AIChatbot;
  window.aiChatbot = aiChatbot;
}
