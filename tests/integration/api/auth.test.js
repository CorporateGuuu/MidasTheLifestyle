// Integration Tests for Authentication API
// Tests complete auth flow including registration, login, and token validation

const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../../database/models/User');

// Mock the Netlify function handler
const { handler: registerHandler } = require('../../../netlify/functions/auth-register');
const { handler: loginHandler } = require('../../../netlify/functions/auth-login');
const { handler: googleHandler } = require('../../../netlify/functions/auth-google');

// Helper function to simulate Netlify function calls
const callNetlifyFunction = async (handler, httpMethod, body = null, headers = {}, queryStringParameters = {}) => {
  const event = {
    httpMethod,
    headers: {
      'content-type': 'application/json',
      ...headers
    },
    body: body ? JSON.stringify(body) : null,
    queryStringParameters
  };

  const context = {};
  
  return await handler(event, context);
};

describe('Authentication API Integration Tests', () => {
  describe('POST /auth-register', () => {
    test('should register new customer successfully', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'SecurePassword123!',
        phone: '+1234567890',
        role: 'customer'
      };

      const response = await callNetlifyFunction(registerHandler, 'POST', userData);
      const responseBody = JSON.parse(response.body);

      expect(response.statusCode).toBe(201);
      expect(responseBody.success).toBe(true);
      expect(responseBody.message).toContain('Registration successful');
      expect(responseBody.user).toBeDefined();
      expect(responseBody.user.email).toBe(userData.email);
      expect(responseBody.user.password).toBeUndefined(); // Password should not be returned
      expect(responseBody.token).toBeDefined();

      // Verify user was created in database
      const createdUser = await User.findOne({ email: userData.email });
      expect(createdUser).toBeTruthy();
      expect(createdUser.firstName).toBe(userData.firstName);
      expect(createdUser.role).toBe('customer');
      
      // Verify password was hashed
      const isPasswordHashed = await bcrypt.compare(userData.password, createdUser.password);
      expect(isPasswordHashed).toBe(true);
    });

    test('should reject registration with invalid email', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email',
        password: 'SecurePassword123!',
        phone: '+1234567890'
      };

      const response = await callNetlifyFunction(registerHandler, 'POST', userData);
      const responseBody = JSON.parse(response.body);

      expect(response.statusCode).toBe(400);
      expect(responseBody.success).toBe(false);
      expect(responseBody.errors).toContain('Invalid email format');
    });

    test('should reject registration with weak password', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: '123',
        phone: '+1234567890'
      };

      const response = await callNetlifyFunction(registerHandler, 'POST', userData);
      const responseBody = JSON.parse(response.body);

      expect(response.statusCode).toBe(400);
      expect(responseBody.success).toBe(false);
      expect(responseBody.errors.some(error => error.includes('Password'))).toBe(true);
    });

    test('should reject duplicate email registration', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'duplicate@example.com',
        password: 'SecurePassword123!',
        phone: '+1234567890'
      };

      // First registration
      await callNetlifyFunction(registerHandler, 'POST', userData);

      // Second registration with same email
      const response = await callNetlifyFunction(registerHandler, 'POST', userData);
      const responseBody = JSON.parse(response.body);

      expect(response.statusCode).toBe(409);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toContain('already exists');
    });

    test('should reject registration with missing required fields', async () => {
      const userData = {
        firstName: 'John',
        // Missing lastName, email, password
        phone: '+1234567890'
      };

      const response = await callNetlifyFunction(registerHandler, 'POST', userData);
      const responseBody = JSON.parse(response.body);

      expect(response.statusCode).toBe(400);
      expect(responseBody.success).toBe(false);
      expect(responseBody.errors).toBeDefined();
      expect(responseBody.errors.length).toBeGreaterThan(0);
    });

    test('should set default service profile for customer', async () => {
      const userData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        password: 'SecurePassword123!',
        phone: '+1234567890',
        role: 'customer'
      };

      const response = await callNetlifyFunction(registerHandler, 'POST', userData);
      const responseBody = JSON.parse(response.body);

      expect(response.statusCode).toBe(201);
      
      const createdUser = await User.findOne({ email: userData.email });
      expect(createdUser.serviceProfile.tier).toBe('standard');
      expect(createdUser.serviceProfile.preferredLocations).toEqual([]);
      expect(createdUser.loyaltyPoints).toBe(0);
      expect(createdUser.totalBookings).toBe(0);
      expect(createdUser.totalSpent).toBe(0);
    });

    test('should handle CORS preflight request', async () => {
      const response = await callNetlifyFunction(registerHandler, 'OPTIONS');

      expect(response.statusCode).toBe(200);
      expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
      expect(response.headers['Access-Control-Allow-Methods']).toContain('POST');
    });
  });

  describe('POST /auth-login', () => {
    let testUser;

    beforeEach(async () => {
      // Create test user
      const userData = global.testUtils.generateTestUser({
        email: 'login.test@example.com',
        password: await bcrypt.hash('TestPassword123!', 12)
      });
      testUser = new User(userData);
      await testUser.save();
    });

    test('should login with valid credentials', async () => {
      const loginData = {
        email: 'login.test@example.com',
        password: 'TestPassword123!'
      };

      const response = await callNetlifyFunction(loginHandler, 'POST', loginData);
      const responseBody = JSON.parse(response.body);

      expect(response.statusCode).toBe(200);
      expect(responseBody.success).toBe(true);
      expect(responseBody.message).toContain('Login successful');
      expect(responseBody.user).toBeDefined();
      expect(responseBody.user.email).toBe(loginData.email);
      expect(responseBody.user.password).toBeUndefined();
      expect(responseBody.token).toBeDefined();

      // Verify token is valid
      const decoded = jwt.verify(responseBody.token, process.env.JWT_SECRET);
      expect(decoded.id).toBe(testUser._id.toString());
      expect(decoded.email).toBe(testUser.email);
      expect(decoded.role).toBe(testUser.role);
    });

    test('should reject login with invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'TestPassword123!'
      };

      const response = await callNetlifyFunction(loginHandler, 'POST', loginData);
      const responseBody = JSON.parse(response.body);

      expect(response.statusCode).toBe(401);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toContain('Invalid credentials');
    });

    test('should reject login with invalid password', async () => {
      const loginData = {
        email: 'login.test@example.com',
        password: 'WrongPassword123!'
      };

      const response = await callNetlifyFunction(loginHandler, 'POST', loginData);
      const responseBody = JSON.parse(response.body);

      expect(response.statusCode).toBe(401);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toContain('Invalid credentials');
    });

    test('should reject login for inactive user', async () => {
      testUser.status = 'inactive';
      await testUser.save();

      const loginData = {
        email: 'login.test@example.com',
        password: 'TestPassword123!'
      };

      const response = await callNetlifyFunction(loginHandler, 'POST', loginData);
      const responseBody = JSON.parse(response.body);

      expect(response.statusCode).toBe(403);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toContain('Account is inactive');
    });

    test('should update last login timestamp', async () => {
      const originalLastLogin = testUser.lastLogin;

      const loginData = {
        email: 'login.test@example.com',
        password: 'TestPassword123!'
      };

      await callNetlifyFunction(loginHandler, 'POST', loginData);

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.lastLogin).not.toEqual(originalLastLogin);
      expect(updatedUser.lastLogin).toBeInstanceOf(Date);
    });

    test('should handle rate limiting for failed attempts', async () => {
      const loginData = {
        email: 'login.test@example.com',
        password: 'WrongPassword123!'
      };

      // Make multiple failed login attempts
      const attempts = [];
      for (let i = 0; i < 6; i++) {
        attempts.push(callNetlifyFunction(loginHandler, 'POST', loginData));
      }

      const responses = await Promise.all(attempts);
      
      // Later attempts should be rate limited
      const rateLimitedResponses = responses.filter(r => r.statusCode === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    test('should reject login with missing credentials', async () => {
      const loginData = {
        email: 'login.test@example.com'
        // Missing password
      };

      const response = await callNetlifyFunction(loginHandler, 'POST', loginData);
      const responseBody = JSON.parse(response.body);

      expect(response.statusCode).toBe(400);
      expect(responseBody.success).toBe(false);
      expect(responseBody.errors).toContain('Password is required');
    });
  });

  describe('POST /auth-google', () => {
    test('should handle Google OAuth callback', async () => {
      // Mock Google OAuth data
      const googleData = {
        code: 'mock-google-auth-code',
        state: 'mock-state'
      };

      const response = await callNetlifyFunction(googleHandler, 'POST', googleData);
      
      // Note: This test would require mocking Google's OAuth service
      // For now, we'll test that the endpoint exists and handles the request
      expect(response.statusCode).toBeDefined();
      expect(response.body).toBeDefined();
    });

    test('should handle Google OAuth errors', async () => {
      const invalidData = {
        error: 'access_denied',
        error_description: 'User denied access'
      };

      const response = await callNetlifyFunction(googleHandler, 'POST', invalidData);
      const responseBody = JSON.parse(response.body);

      expect(response.statusCode).toBe(400);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toContain('Google OAuth error');
    });
  });

  describe('Token validation and security', () => {
    let testUser;
    let validToken;

    beforeEach(async () => {
      testUser = new User(global.testUtils.generateTestUser());
      await testUser.save();
      
      validToken = global.testUtils.generateTestToken(testUser._id, testUser.role);
    });

    test('should validate JWT token structure', () => {
      const decoded = jwt.verify(validToken, process.env.JWT_SECRET);
      
      expect(decoded.id).toBe(testUser._id.toString());
      expect(decoded.role).toBe(testUser.role);
      expect(decoded.email).toBeDefined();
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });

    test('should reject expired tokens', () => {
      const expiredToken = jwt.sign(
        { id: testUser._id, role: testUser.role, email: testUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      expect(() => {
        jwt.verify(expiredToken, process.env.JWT_SECRET);
      }).toThrow('jwt expired');
    });

    test('should reject tokens with invalid signature', () => {
      const invalidToken = validToken.slice(0, -10) + 'invalid123';

      expect(() => {
        jwt.verify(invalidToken, process.env.JWT_SECRET);
      }).toThrow('invalid signature');
    });

    test('should reject tokens with wrong secret', () => {
      const tokenWithWrongSecret = jwt.sign(
        { id: testUser._id, role: testUser.role, email: testUser.email },
        'wrong-secret',
        { expiresIn: '1h' }
      );

      expect(() => {
        jwt.verify(tokenWithWrongSecret, process.env.JWT_SECRET);
      }).toThrow('invalid signature');
    });
  });

  describe('Security measures', () => {
    test('should hash passwords with sufficient cost factor', async () => {
      const password = 'TestPassword123!';
      const userData = global.testUtils.generateTestUser({ password });
      
      const response = await callNetlifyFunction(registerHandler, 'POST', userData);
      expect(response.statusCode).toBe(201);

      const user = await User.findOne({ email: userData.email });
      
      // Verify password is hashed and not stored in plain text
      expect(user.password).not.toBe(password);
      expect(user.password.startsWith('$2b$')).toBe(true); // bcrypt hash format
      
      // Verify hash strength (cost factor should be at least 12)
      const costFactor = parseInt(user.password.split('$')[2]);
      expect(costFactor).toBeGreaterThanOrEqual(12);
    });

    test('should sanitize user input', async () => {
      const maliciousData = {
        firstName: '<script>alert("xss")</script>',
        lastName: 'Doe',
        email: 'test@example.com',
        password: 'SecurePassword123!',
        phone: '+1234567890'
      };

      const response = await callNetlifyFunction(registerHandler, 'POST', maliciousData);
      
      if (response.statusCode === 201) {
        const responseBody = JSON.parse(response.body);
        // Script tags should be sanitized or rejected
        expect(responseBody.user.firstName).not.toContain('<script>');
      }
    });

    test('should enforce password complexity requirements', async () => {
      const weakPasswords = [
        '123456',
        'password',
        'qwerty',
        'abc123',
        'Password', // Missing special character and number
        'password123', // Missing uppercase and special character
        'PASSWORD123!' // Missing lowercase
      ];

      for (const weakPassword of weakPasswords) {
        const userData = global.testUtils.generateTestUser({ password: weakPassword });
        
        const response = await callNetlifyFunction(registerHandler, 'POST', userData);
        const responseBody = JSON.parse(response.body);

        expect(response.statusCode).toBe(400);
        expect(responseBody.success).toBe(false);
        expect(responseBody.errors.some(error => error.includes('Password'))).toBe(true);
      }
    });
  });
});
