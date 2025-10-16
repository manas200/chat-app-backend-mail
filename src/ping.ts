import axios from 'axios';

/**
 * Simple script to ping the mail service to keep it alive on Render
 * This can be called by an external cron job service
 */
async function pingMailService() {
  try {
    // Replace with your actual mail service URL
    const serviceUrl = process.env.MAIL_SERVICE_URL || 'https://chat-app-backend-mail.onrender.com';
    
    console.log(`Pinging mail service at: ${serviceUrl}`);
    const response = await axios.get(serviceUrl);
    
    console.log(`Ping successful! Status: ${response.status}, Response: ${response.data}`);
    return { success: true, status: response.status };
  } catch (error) {
    console.error('Failed to ping mail service:', error);
    return { success: false, error };
  }
}

// Execute if run directly
if (require.main === module) {
  pingMailService();
}

export default pingMailService;