// This file is kept for backwards compatibility
// The actual dashboards are in separate files:
// - LearnerDashboard.jsx
// - TrainerDashboard.jsx  
// - AdminDashboard.jsx
// - SuperAdminDashboard.jsx

// The routing is handled in App.jsx via RoleBasedDashboard component
export { default as LearnerDashboard } from './LearnerDashboard';
export { default as TrainerDashboard } from './TrainerDashboard';
export { default as AdminDashboard } from './AdminDashboard';
export { default as SuperAdminDashboard } from './SuperAdminDashboard';
