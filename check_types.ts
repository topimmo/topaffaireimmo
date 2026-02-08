import jwt, { SignOptions } from 'jsonwebtoken';

// Check what SignOptions expects
const options: SignOptions = {
  algorithm: 'HS256',
  expiresIn: '15m'
};

console.log('Types OK');
