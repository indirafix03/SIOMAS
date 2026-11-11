require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PORT, sequelize } = require('./config/database');
const { UPLOAD_DIR } = require('./config/upload');
const { startEmailReminderCron } = require('./services/emailService');

// Import Modular Routes (UC-01 to UC-12)
const swaggerRoutes = require('./routes/swaggerRoutes');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const documentRoutes = require('./routes/documentRoutes');
const interukmRoutes = require('./routes/interukmRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// Global Middlewares
app.use(cors({ origin: '*', exposedHeaders: ['Content-Disposition'] }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static Files for Uploaded Documents & Banners
app.use('/api/v1/interukm/files', express.static(UPLOAD_DIR));
app.use('/uploads', express.static(UPLOAD_DIR));

// Register Modular Routes
app.use(swaggerRoutes);       // Health Check & Swagger UI (/apidocs)
app.use(authRoutes);          // UC-02 & UC-03: Auth, Register, Login & User RBAC Management
app.use(profileRoutes);       // UC-01: User Profile & UKM Jobdesks
app.use(scheduleRoutes);      // UC-04: Schedules / Kalender Agenda UKM
app.use(announcementRoutes);  // UC-03 & UC-05: Priority Announcements & Read Status
app.use(documentRoutes);      // UC-06, UC-08, UC-09, UC-10: LPJ, Sipakamase, Vault & .ZIP Bundle
app.use(interukmRoutes);      // UC-11: Hub Inter-UKM & Cross-UKM Collaboration (BR-02)
app.use(notificationRoutes);  // UC-07 & UC-12: Coordinator Stats, Email Logs, Scheduler, Webhook & Audit Logs

// Start UC-12 Hourly Email Reminder Cron Job
startEmailReminderCron();

// Start Express Server
app.listen(PORT, '0.0.0.0', async () => {
  try {
    await sequelize.authenticate();
    console.log('======================================================================');
    console.log(`🚀 SIOMAS Node.js + Express.js REST API running on http://127.0.0.1:${PORT}`);
    console.log('☁️  Connected to Neon Cloud PostgreSQL (siomas_db) via Sequelize + pg');
    console.log('⏰ UC-12 node-cron Email Reminder Scheduler active (every 1 hour)');
    console.log('======================================================================');
  } catch (err) {
    console.error('Database connection error:', err.message);
  }
});
