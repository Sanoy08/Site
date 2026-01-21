// src/lib/auth-helper.ts
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export async function verifyAdmin(request: NextRequest): Promise<boolean> {
  if (!JWT_SECRET) return false;

  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;

  try {
    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    // রোল চেক
    return decoded.role === 'admin';
  } catch (error) {
    return false;
  }
}