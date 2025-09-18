// API retry utility for handling rate limiting and temporary failures

const defaultRetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffFactor: 2
};

export const retryApiCall = async (apiCall, config = {}) => {
  const retryConfig = { ...defaultRetryConfig, ...config };
  let lastError;

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;
      
      // Don't retry on certain error types
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw error; // Authentication/authorization errors shouldn't be retried
      }
      
      // Don't retry on the last attempt
      if (attempt === retryConfig.maxRetries) {
        break;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        retryConfig.baseDelay * Math.pow(retryConfig.backoffFactor, attempt),
        retryConfig.maxDelay
      );
      
      console.log(`API call failed (attempt ${attempt + 1}/${retryConfig.maxRetries + 1}), retrying in ${delay}ms...`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

export default retryApiCall;
