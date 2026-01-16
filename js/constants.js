// ============================================
// CONSTANTS
// ============================================
const PRIORITIES = { 
    high: '#ef4444', 
    medium: '#f59e0b', 
    low: '#22c55e' 
  };
  
  const CATEGORIES = ['Personal', 'Health', 'Learning', 'Other'];
  
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  const STORAGE_KEY = 'planner-tasks-v5';
  const TRASH_KEY = 'planner-trash-v1';
  const AUTH_KEY = 'planner-auth-v1';
  const USERS_KEY = 'planner-users-v1';
  
  // Google OAuth Client ID - Replace with your actual client ID from Google Cloud Console
  // Get it from: https://console.cloud.google.com/apis/credentials
  const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID_HERE';