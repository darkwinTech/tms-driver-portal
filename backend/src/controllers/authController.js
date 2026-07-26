import { ApiError } from '../utils/ApiError.js';
import { userRepository } from '../data/index.js';
import { comparePassword, hashPassword, signToken, sanitizeUser } from '../services/authService.js';
import { USER_ROLES } from '../utils/constants.js';

export async function login(req, res) {
  const { email, password } = req.body;
  const user = email ? await userRepository.findByEmail(email) : null;

  if (!user || !user.isActive || !(await comparePassword(password || '', user.passwordHash))) {
    throw new ApiError('Invalid credentials', 401);
  }

  const sanitized = sanitizeUser(user);
  res.json({ token: signToken(user), user: sanitized });
}

export async function register(req, res) {
  const { employeeId, fullName, email, password, roleName, department, managerId } = req.body;

  if (!employeeId || !fullName || !email || !password || !roleName || !department) {
    throw new ApiError('employeeId, fullName, email, password, roleName, and department are required');
  }
  if (!USER_ROLES.includes(roleName)) {
    throw new ApiError(`Unknown role: ${roleName}`);
  }
  if (await userRepository.findByEmail(email)) {
    throw new ApiError('A user with this email already exists');
  }

  const user = await userRepository.create({
    employeeId,
    fullName,
    email: email.toLowerCase().trim(),
    department,
    role: roleName,
    managerId: managerId || null,
    isActive: true,
    passwordHash: await hashPassword(password),
  });

  const sanitized = sanitizeUser(user);
  res.status(201).json({ token: signToken(user), user: sanitized });
}

export async function me(req, res) {
  res.json({ user: req.user });
}


 