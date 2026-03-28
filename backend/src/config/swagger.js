const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TaskFlow API',
      version: '1.0.0',
      description: `
## TaskFlow REST API

A secure, scalable REST API with:
- 🔐 JWT Authentication (access + refresh tokens)
- 👥 Role-Based Access Control (user / admin)
- ✅ Full CRUD on Tasks
- 🛡️ Input validation & sanitization
- 📊 API versioning (/api/v1)

### Default Admin Credentials
- **Email:** admin@taskflow.com
- **Password:** Admin@123
      `,
      contact: { name: 'TaskFlow Support', email: 'support@taskflow.com' },
    },
    servers: [
      { url: 'http://localhost:5000', description: 'Development' },
      { url: 'https://taskflow-api.onrender.com', description: 'Production' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id:         { type: 'string', format: 'uuid' },
            name:       { type: 'string', example: 'Jane Doe' },
            email:      { type: 'string', format: 'email', example: 'jane@example.com' },
            role:       { type: 'string', enum: ['user', 'admin'] },
            is_active:  { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Task: {
          type: 'object',
          properties: {
            id:          { type: 'string', format: 'uuid' },
            title:       { type: 'string', example: 'Build REST API' },
            description: { type: 'string', example: 'Implement all CRUD endpoints' },
            status:      { type: 'string', enum: ['pending', 'in_progress', 'completed', 'cancelled'] },
            priority:    { type: 'string', enum: ['low', 'medium', 'high'] },
            due_date:    { type: 'string', format: 'date', example: '2025-12-31' },
            user_id:     { type: 'string', format: 'uuid' },
            created_at:  { type: 'string', format: 'date-time' },
            updated_at:  { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors:  { type: 'array', items: { type: 'object' } },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success:      { type: 'boolean', example: true },
            message:      { type: 'string' },
            accessToken:  { type: 'string' },
            refreshToken: { type: 'string' },
            user:         { $ref: '#/components/schemas/User' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/v1/*.js'],
};

module.exports = swaggerJsdoc(options);
