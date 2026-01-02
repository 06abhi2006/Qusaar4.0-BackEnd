import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    specialization?: string;
    department?: string;
  };
}

export interface SignupData {
  email: string;
  password: string;
  name: string;
  role?: 'admin' | 'doctor' | 'receptionist' | 'patient';
}

export class AuthService {
  /**
   * Register a new user account
   * Note: In production, only admins should be able to create admin/doctor/receptionist accounts
   * Patients can self-register
   */
  static async signup(data: SignupData): Promise<AuthResponse> {
    const { email, password, name, role = 'patient' } = data;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        passwordHash,
        role: role as any,
        status: 'active',
      },
      include: {
        doctor: true,
      },
    });

    // Generate JWT token
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured');
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET as string,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      } as jwt.SignOptions
    );

    // Build user response
    const userResponse: AuthResponse['user'] = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    // Add doctor-specific fields if applicable
    if (user.role === 'doctor' && user.doctor) {
      userResponse.specialization = user.doctor.specialization;
      userResponse.department = user.doctor.department;
    }

    // Add patient-specific fields which might have been just created
    if (user.role === 'patient') {
      // We just created it or it exists
      const patient = await prisma.patient.findUnique({ where: { userId: user.id } });
      if (patient) {
        (userResponse as any).patientId = patient.patientId;
      }
    }

    // Create Patient record if role is patient
    if (user.role === 'patient') {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const patientId = `PAT-${dateStr}-${randomSuffix}`;

      await prisma.patient.create({
        data: {
          userId: user.id,
          patientId: patientId,
          // other fields are optional now
        }
      });
    }

    return {
      token,
      user: userResponse,
    };
  }

  /**
   * Authenticate user and generate JWT token
   */
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { email, password } = credentials;

    // Determine if input is email or patientId
    const isEmail = email.includes('@');

    let user;

    if (isEmail) {
      user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        include: {
          doctor: true,
          patient: true,
        },
      });
    } else {
      // Try finding by Patient ID
      const patient = await prisma.patient.findUnique({
        where: { patientId: email }, // treating email field as identifier
        include: {
          user: {
            include: {
              doctor: true,
              patient: true
            }
          }
        }
      });
      user = patient?.user;
    }

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if user is active
    if (user.status !== 'active') {
      throw new Error('Account is inactive');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Generate JWT token
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured');
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET as string,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      } as jwt.SignOptions
    );

    // Build user response
    const userResponse: AuthResponse['user'] = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    // Add doctor-specific fields if applicable
    if (user.role === 'doctor' && user.doctor) {
      userResponse.specialization = user.doctor.specialization;
      userResponse.department = user.doctor.department;
    }

    // Add patient-specific fields
    if (user.role === 'patient' && user.patient) {
      (userResponse as any).patientId = user.patient.patientId;
    }

    return {
      token,
      user: userResponse,
    };
  }

  /**
   * Hash password for storage
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }
}

