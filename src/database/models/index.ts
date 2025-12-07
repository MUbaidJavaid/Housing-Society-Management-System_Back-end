import User from './User';

// Export all models
export { User };

// Export model initialization function
export const initializeModels = () => {
  console.log('Database models initialized');
  return { User };
};

// Export type exports from models
export type { IUser, IUserDocument, UserRole, UserStatus } from './User';
