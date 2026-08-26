import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Merchant } from '../models/Merchant';
import { MerchantPolicy } from '../models/MerchantPolicy';
import { registerSchema, loginSchema } from '../validators/auth';
import { AuthRequest } from '../middleware/authMiddleware';

export async function register(req: Request, res: Response) {
  try {
    const body = registerSchema.parse(req.body);
    
    // Check if email already exists
    const existingUser = await User.findOne({ email: body.email });
    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email address already exists.' });
    }

    // 1. Create a new Merchant organization
    const workspaceId = 'ws_' + Math.random().toString(36).substring(2, 15);
    const merchant = new Merchant({
      name: body.companyName,
      workspaceId
    });
    await merchant.save();

    // 2. Create the default policy for this merchant
    const policy = new MerchantPolicy({
      merchantId: merchant._id
    });
    await policy.save();

    // 3. Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(body.password, salt);

    // 4. Create the User (default role is Admin for registration creator)
    const user = new User({
      email: body.email,
      passwordHash,
      firstName: body.firstName,
      lastName: body.lastName,
      role: body.role || 'Admin',
      merchantId: merchant._id
    });
    await user.save();

    // 5. Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, merchantId: merchant._id },
      process.env.JWT_SECRET || 'super_secret_recoverai_key_2026',
      { expiresIn: (process.env.JWT_EXPIRES_IN || '24h') as any }
    );

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        merchantId: merchant._id
      }
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors[0]?.message || 'Validation error' });
    }
    console.error('Error during registration:', error);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const body = loginSchema.parse(req.body);

    const user = await User.findOne({ email: body.email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(body.password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, merchantId: user.merchantId },
      process.env.JWT_SECRET || 'super_secret_recoverai_key_2026',
      { expiresIn: (process.env.JWT_EXPIRES_IN || '24h') as any }
    );

    return res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        merchantId: user.merchantId
      }
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors[0]?.message || 'Validation error' });
    }
    console.error('Error during login:', error);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
}

export async function me(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const merchant = await Merchant.findById(user.merchantId);
    return res.json({
      user,
      merchant
    });
  } catch (error) {
    console.error('Error in /me:', error);
    return res.status(500).json({ error: 'Internal server error fetching user.' });
  }
}
