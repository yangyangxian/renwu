import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ApiErrorResponse, LoginReqDto, UserResDto, LoginResDto } from '@fullstack/common';
import { apiClient } from '../utils/APIClient';
import logger from '../utils/logger';
import { authLogin, authLogout, authMe, authSignup } from '@/apiRequests/apiEndpoints';

interface IAuthContext {
  isAuthenticated: boolean;
  user: UserResDto | null;
  setUser: React.Dispatch<React.SetStateAction<UserResDto | null>>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<IAuthContext | undefined>(undefined);

export function useAuth(): IAuthContext {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserResDto | null>(null);
  const [isInitialAuthCheckComplete, setIsInitialAuthCheckComplete] = useState(false);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    apiClient.get<UserResDto>(authMe())
      .then((userData: UserResDto) => {
        setUser(userData);
        setIsAuthenticated(true);
        logger.info('User authenticated:', userData);
      })
      .catch(() => {
        setUser(null);
        setIsAuthenticated(false);
        logger.info('User not authenticated');
      })
      .finally(() => {
        setIsInitialAuthCheckComplete(true);
      });
  };

  const login = (email: string, password: string): Promise<void> => {
    return apiClient.post<LoginReqDto, LoginResDto>(
      authLogin(),
      { email, password }
    )
      .then((loginData: LoginResDto) => {
        // Optionally, you can store the token in memory or localStorage if needed
        const { token, ...userFields } = loginData;
        setUser(userFields);
        setIsAuthenticated(true);
        logger.info('Login successful:', loginData);
      })
      .catch((error : ApiErrorResponse) => {
        logger.error('Login failed:', error);
        throw error; // Re-throw so LoginPage can handle it
      });
  };

  const logout = (): Promise<void> => {
    return apiClient.post(authLogout(), {})
      .then(() => {
        setUser(null);
        setIsAuthenticated(false);
        logger.info('Logout successful');
      })
      .catch((error : ApiErrorResponse) => {
        logger.error('Logout failed:', error);
        // Even if logout fails on server, clear local state
        setUser(null);
        setIsAuthenticated(false);
      });
  };

  const signup = (email: string, password: string): Promise<void> => {
    return apiClient.post<LoginReqDto, UserResDto>(
      authSignup(),
      { email, password }
    )
      .then((userData: UserResDto) => {
        setUser(userData);
        setIsAuthenticated(true);
        logger.info('Signup successful:', userData);
      })
      .catch((error: ApiErrorResponse) => {
        logger.error('Signup failed:', error);
        throw error;
      });
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, setUser, login, logout, signup }}>
      {isInitialAuthCheckComplete ? children : null}
    </AuthContext.Provider>
  );
}
