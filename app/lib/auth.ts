import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
}

export interface UserSession {
  id: string;
  email: string;
  name: string;
}

const USERS_STORAGE_KEY = 'eduai_users';
const SESSION_STORAGE_KEY = 'eduai_session';

// Get all users from localStorage
export function getAllUsers(): User[] {
  if (typeof window === 'undefined') return [];
  const usersData = localStorage.getItem(USERS_STORAGE_KEY);
  return usersData ? JSON.parse(usersData) : [];
}

// Save users to localStorage
function saveUsers(users: User[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

// Get user by email
export function getUserByEmail(email: string): User | null {
  const users = getAllUsers();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
}

// Create a new user
export async function createUser(email: string, password: string, name: string): Promise<{ success: boolean; error?: string; user?: UserSession }> {
  // Validate inputs
  if (!email || !password || !name) {
    return { success: false, error: 'All fields are required' };
  }

  if (!email.includes('@') || !email.includes('.')) {
    return { success: false, error: 'Invalid email format' };
  }

  if (password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters long' };
  }

  if (name.length < 2) {
    return { success: false, error: 'Name must be at least 2 characters long' };
  }

  // Check if user already exists
  const existingUser = getUserByEmail(email);
  if (existingUser) {
    return { success: false, error: 'User with this email already exists' };
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create new user
  const newUser: User = {
    id: crypto.randomUUID(),
    email: email.toLowerCase(),
    name,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  // Save to localStorage
  const users = getAllUsers();
  users.push(newUser);
  saveUsers(users);

  // Create session
  const userSession: UserSession = {
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
  };

  return { success: true, user: userSession };
}

// Verify user credentials
export async function verifyUser(email: string, password: string): Promise<{ success: boolean; error?: string; user?: UserSession }> {
  // Validate inputs
  if (!email || !password) {
    return { success: false, error: 'Email and password are required' };
  }

  // Get user
  const user = getUserByEmail(email);
  if (!user) {
    return { success: false, error: 'Invalid email or password' };
  }

  // Verify password
  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return { success: false, error: 'Invalid email or password' };
  }

  // Create session
  const userSession: UserSession = {
    id: user.id,
    email: user.email,
    name: user.name,
  };

  return { success: true, user: userSession };
}

// Save session to localStorage
export function saveSession(user: UserSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
}

// Get current session
export function getSession(): UserSession | null {
  if (typeof window === 'undefined') return null;
  const sessionData = localStorage.getItem(SESSION_STORAGE_KEY);
  return sessionData ? JSON.parse(sessionData) : null;
}

// Clear session
export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_STORAGE_KEY);
}
