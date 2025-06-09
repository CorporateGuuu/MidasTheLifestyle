// Admin Reports and Business Intelligence API for Midas The Lifestyle
// Comprehensive reporting with automated insights and data export

const { withDatabase } = require('../../database/connection');
const { withAuth } = require('./auth-middleware');
const {
  generateFinancialReport,
  generateOperationalReport,
  generateCustomerAnalyticsReport,
  generateKPIDashboard,
  validateAdminPermissions
} = require('../../services/businessIntelligenceService');

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

// Log API events
const logAPIEvent = (eventType, data, severity = 'info') => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    service: 'admin-reports-api',
    eventType,
    severity,
    data
  };
  
  console.log(JSON.stringify(logEntry));
  
  // Send to monitoring service
  if (process.env.NODE_ENV === 'production' && process.env.MONITORING_WEBHOOK_URL) {
    fetch(process.env.MONITORING_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logEntry)
    }).catch(err => console.error('Monitoring webhook failed:', err));
  }
};

// Main reports handler
const reportsHandler = withAuth(async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }
  
  try {
    // Validate admin permissions
    validateAdminPermissions(event.user, 'concierge');
    
    const method = event.httpMethod;
    const queryParams = event.queryStringParameters || {};
    
    logAPIEvent('reports_request', {
      method,
      queryParams,
      userId: event.user.id,
      userRole: event.user.role
    }, 'info');
    
    // Route based on method
    if (method === 'GET') {
      return await handleGetReports(event, queryParams);
    } else if (method === 'POST') {
      return await handleGenerateReport(event);
    } else {
      return {
        statusCode: 405,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }
    
  } catch (error) {
    logAPIEvent('reports_request_error', {
      error: error.message,
      stack: error.stack,
      userId: event.user?.id
    }, 'error');
    
    // Handle permission errors
    if (error.message.includes('Insufficient permissions')) {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Access denied',
          message: error.message
        })
      };
    }
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Reports operation failed',
        message: 'We apologize for the inconvenience. Please try again or contact support.'
      })
    };
  }
}, { roles: ['concierge', 'admin', 'super-admin'] });

// Handle GET requests for reports
const handleGetReports = async (event, queryParams) => {
  const { 
    reportType = 'kpi', 
    startDate, 
    endDate, 
    granularity = 'daily',
    dateRange = 30,
    format = 'json'
  } = queryParams;
  
  try {
    // Validate date parameters
    let start, end;
    
    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            error: 'Invalid date format',
            message: 'Please provide dates in ISO format (YYYY-MM-DD)'
          })
        };
      }
      
      if (start >= end) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            error: 'Invalid date range',
            message: 'Start date must be before end date'
          })
        };
      }
    } else {
      // Use dateRange parameter
      end = new Date();
      start = new Date();
      start.setDate(start.getDate() - parseInt(dateRange));
    }
    
    // Generate report based on type
    switch (reportType) {
      case 'financial':
        return await handleFinancialReport(start, end, granularity, format);
      case 'operational':
        return await handleOperationalReport(start, end, format);
      case 'customer-analytics':
        return await handleCustomerAnalyticsReport(start, end, format);
      case 'kpi':
        return await handleKPIDashboard(parseInt(dateRange), format);
      default:
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            error: 'Invalid report type',
            message: 'Supported types: financial, operational, customer-analytics, kpi'
          })
        };
    }
    
  } catch (error) {
    logAPIEvent('report_generation_error', {
      reportType,
      error: error.message,
      userId: event.user.id
    }, 'error');
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Report generation failed',
        message: error.message
      })
    };
  }
};

// Handle financial report
const handleFinancialReport = async (startDate, endDate, granularity, format) => {
  const report = await generateFinancialReport(startDate, endDate, granularity);
  
  logAPIEvent('financial_report_served', {
    startDate,
    endDate,
    granularity,
    format,
    totalRevenue: report.summary.totalRevenue,
    totalBookings: report.summary.totalBookings
  }, 'info');
  
  return {
    statusCode: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': format === 'csv' ? 'text/csv' : 'application/json'
    },
    body: format === 'csv' ? convertToCSV(report) : JSON.stringify({
      success: true,
      reportType: 'financial',
      data: report,
      generatedAt: new Date().toISOString(),
      format
    })
  };
};

// Handle operational report
const handleOperationalReport = async (startDate, endDate, format) => {
  const report = await generateOperationalReport(startDate, endDate);
  
  logAPIEvent('operational_report_served', {
    startDate,
    endDate,
    format,
    avgRating: report.customerService.avgRating,
    avgUtilization: report.inventoryMetrics.avgUtilization
  }, 'info');
  
  return {
    statusCode: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': format === 'csv' ? 'text/csv' : 'application/json'
    },
    body: format === 'csv' ? convertToCSV(report) : JSON.stringify({
      success: true,
      reportType: 'operational',
      data: report,
      generatedAt: new Date().toISOString(),
      format
    })
  };
};

// Handle customer analytics report
const handleCustomerAnalyticsReport = async (startDate, endDate, format) => {
  const report = await generateCustomerAnalyticsReport(startDate, endDate);
  
  logAPIEvent('customer_analytics_report_served', {
    startDate,
    endDate,
    format,
    newCustomers: report.acquisition.length,
    retentionRate: report.retention.retentionRate
  }, 'info');
  
  return {
    statusCode: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': format === 'csv' ? 'text/csv' : 'application/json'
    },
    body: format === 'csv' ? convertToCSV(report) : JSON.stringify({
      success: true,
      reportType: 'customer-analytics',
      data: report,
      generatedAt: new Date().toISOString(),
      format
    })
  };
};

// Handle KPI dashboard
const handleKPIDashboard = async (dateRange, format) => {
  const kpis = await generateKPIDashboard(dateRange);
  
  logAPIEvent('kpi_dashboard_served', {
    dateRange,
    format,
    totalRevenue: kpis.revenue.total,
    totalBookings: kpis.bookings.total,
    newCustomers: kpis.customers.new
  }, 'info');
  
  return {
    statusCode: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': format === 'csv' ? 'text/csv' : 'application/json'
    },
    body: format === 'csv' ? convertToCSV(kpis) : JSON.stringify({
      success: true,
      reportType: 'kpi',
      data: kpis,
      generatedAt: new Date().toISOString(),
      format
    })
  };
};

// Handle POST requests for custom report generation
const handleGenerateReport = async (event) => {
  try {
    const requestData = JSON.parse(event.body);
    const { 
      reportType, 
      parameters, 
      schedule, 
      recipients,
      format = 'json'
    } = requestData;
    
    // Validate required fields
    if (!reportType) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Report type is required'
        })
      };
    }
    
    // Handle scheduled report creation
    if (schedule) {
      return await handleScheduledReport(reportType, parameters, schedule, recipients, event.user.id);
    }
    
    // Handle immediate custom report generation
    return await handleCustomReport(reportType, parameters, format, event.user.id);
    
  } catch (error) {
    logAPIEvent('custom_report_error', {
      error: error.message,
      userId: event.user.id
    }, 'error');
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Custom report generation failed',
        message: error.message
      })
    };
  }
};

// Handle custom report generation
const handleCustomReport = async (reportType, parameters, format, userId) => {
  const { startDate, endDate, filters, granularity } = parameters || {};
  
  // Set default date range if not provided
  const end = endDate ? new Date(endDate) : new Date();
  const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  let report;
  
  switch (reportType) {
    case 'financial':
      report = await generateFinancialReport(start, end, granularity || 'daily');
      break;
    case 'operational':
      report = await generateOperationalReport(start, end);
      break;
    case 'customer-analytics':
      report = await generateCustomerAnalyticsReport(start, end);
      break;
    case 'kpi':
      const dateRange = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      report = await generateKPIDashboard(dateRange);
      break;
    default:
      throw new Error(`Unsupported report type: ${reportType}`);
  }
  
  logAPIEvent('custom_report_generated', {
    reportType,
    startDate: start,
    endDate: end,
    format,
    userId
  }, 'info');
  
  return {
    statusCode: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': format === 'csv' ? 'text/csv' : 'application/json'
    },
    body: format === 'csv' ? convertToCSV(report) : JSON.stringify({
      success: true,
      reportType,
      data: report,
      parameters,
      generatedAt: new Date().toISOString(),
      generatedBy: userId,
      format
    })
  };
};

// Handle scheduled report creation
const handleScheduledReport = async (reportType, parameters, schedule, recipients, userId) => {
  // This would integrate with a job scheduler like AWS EventBridge or similar
  // For now, return a placeholder response
  
  logAPIEvent('scheduled_report_created', {
    reportType,
    schedule,
    recipients: recipients?.length || 0,
    userId
  }, 'info');
  
  return {
    statusCode: 201,
    headers: corsHeaders,
    body: JSON.stringify({
      success: true,
      message: 'Scheduled report created successfully',
      scheduleId: `schedule-${Date.now()}`,
      reportType,
      schedule,
      recipients,
      createdBy: userId,
      createdAt: new Date().toISOString()
    })
  };
};

// Convert report data to CSV format
const convertToCSV = (data) => {
  // Simple CSV conversion - would need more sophisticated handling for complex nested data
  try {
    if (typeof data !== 'object') {
      return 'No data available';
    }
    
    // For now, return a simple CSV representation
    const headers = Object.keys(data);
    const csvHeaders = headers.join(',');
    const csvData = headers.map(header => {
      const value = data[header];
      return typeof value === 'object' ? JSON.stringify(value) : value;
    }).join(',');
    
    return `${csvHeaders}\n${csvData}`;
    
  } catch (error) {
    return 'Error converting to CSV format';
  }
};

module.exports = { handler: reportsHandler };
