/**
 * authController.ts
 *
 * Handles user registration and login.
 * Returns a JWT token on success — the client stores this and sends it
 * with every subsequent request via the Authorization header.
 *
 * Security decisions:
 * - Passwords are NEVER stored in plain text (bcrypt in userModel)
 * - JWT expires in 7 days (balance between security and UX)
 * - Same error message for wrong email OR wrong password (prevents user enumeration)
 */

import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel';

class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, first_name, last_name, role } = req.body;

      if (!email || !password || !first_name || !last_name) {
        res.status(400).json({ error: 'All fields are required' });
        return;
      }

      // Check duplicate BEFORE hashing — hashing is expensive (CPU intensive)
      // No point hashing if the email is already taken
      const existingUser = await userModel.findByEmail(email);
      if (existingUser) {
        res.status(409).json({ error: 'Email already registered' });
        return;
      }

      // userModel.create() handles bcrypt hashing internally
      // Password is hashed ONCE and never stored plain
      const newUser = await userModel.create({
        email,
        password,
        first_name,
        last_name,
        role: role || 'staff', // Default to lowest privilege
      });

      /**
       * JWT payload — what gets encoded inside the token.
       *
       * We include userId, email, role so controllers can use
       * req.user.userId and req.user.role without a DB lookup.
       *
       * Why NOT include password_hash?
       * JWTs are base64-encoded (not encrypted) — anyone can decode them.
       * Only put in data you'd be OK with the user seeing.
       *
       * expiresIn: '7d' — token expires after 7 days.
       * After expiry, user must log in again to get a fresh token.
       */
      const token = jwt.sign(
        { userId: newUser.id, email: newUser.email, role: newUser.role },
        process.env.JWT_SECRET as string,
        { expiresIn: '7d' },
      );

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          first_name: newUser.first_name,
          last_name: newUser.last_name,
          role: newUser.role,
          // password_hash intentionally excluded from response
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }

      const user = await userModel.findByEmail(email);

      /**
       * Why same error for wrong email AND wrong password?
       * If we said "email not found" for unknown emails, an attacker
       * could enumerate which emails are registered.
       * Saying "Invalid email or password" for both cases prevents this.
       */
      if (!user) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      // bcrypt.compare — constant time comparison (prevents timing attacks)
      const isPasswordValid = await userModel.verifyPassword(
        password,
        user.password_hash,
      );
      if (!isPasswordValid) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET as string,
        { expiresIn: '7d' },
      );

      res.status(200).json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      // req.user is attached by authenticateToken middleware
      const userId = (req as any).user.userId;

      // Fetch fresh data from DB — don't trust JWT payload alone
      // (role could have changed since token was issued)
      const user = await userModel.findById(userId);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.status(200).json({
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default new AuthController();
