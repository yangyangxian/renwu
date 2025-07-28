import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { publicRoutes } from '@/routes/routeConfig';
import { matchRoutePattern } from '@/routes/routeUtils';
import { ApiErrorResponse, LoginReqDto, UserResDto, LoginResDto, ErrorCodes } from '@fullstack/common';
import { apiClient } from '../utils/APIClient';
import logger from '../utils/logger';
import { authLogin, authLogout, authMe, authSignup } from '@/apiRequests/apiEndpoints';

interface IAuthContext {
  isAuthenticated: boolean;
  authServerError: boolean;
  user: UserResDto | null;
  setUser: React.Dispatch<React.SetStateAction<UserResDto | null>>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, token?: string) => Promise<void>;
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
  const [authServerError, setAuthServerError] = useState(false);
  const [isInitialAuthCheckComplete, setIsInitialAuthCheckComplete] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Always check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    setAuthServerError(false);
    apiClient.get<UserResDto>(authMe())
      .then((userData: UserResDto) => {
        setUser(userData);
        setIsAuthenticated(true);
        logger.info('User authenticated:', userData);
      })
      .catch((error: ApiErrorResponse) => {
        if (error?.code === ErrorCodes.UNAUTHORIZED) {
          setUser(null);
          setIsAuthenticated(false);
          logger.info('User not authenticated (unauthorized)');
        } else {
          logger.error('Auth check failed, but not unauthorized:', error);
          setIsAuthenticated(false);
          setAuthServerError(true);
        }
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
        navigate('/login', { replace: true });
        logger.info('Logout successful');
      })
      .catch((error : ApiErrorResponse) => {
        logger.error('Logout failed:', error);
        // Even if logout fails on server, clear local state
        setUser(null);
        setIsAuthenticated(false);
      });
  };

  const signup = (email: string, password: string, token?: string): Promise<void> => {
    const payload: any = { email, password };
    if (token) payload.token = token;
    return apiClient.post<LoginReqDto, UserResDto>(
      authSignup(),
      payload
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
    <AuthContext.Provider value={{ isAuthenticated,authServerError, user, setUser, login, logout, signup }}>
      {isInitialAuthCheckComplete ? children : null}
    </AuthContext.Provider>
  );
}
