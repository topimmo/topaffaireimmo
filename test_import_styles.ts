import * as jwt from 'jsonwebtoken';

const secret = 'test';
const payload = { phone: '123' };

// Method 1: Using namespace import
const token1 = jwt.sign(payload, secret, {
  algorithm: 'HS256',
  expiresIn: '15m'
});

console.log('Namespace import works');
