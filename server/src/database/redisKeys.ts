// Centralized Redis key patterns for user-related data

// Sorted set for all user emails (for autocomplete)
export const USERS_EMAILS_ZSET = 'users:emails';

// Function to get the user info key for a given email
export const userInfoKey = (email: string) => `user:${email}`;
