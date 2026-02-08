import jwt from 'jsonwebtoken';

// Test signature for jwt.sign
const secret = 'test-secret';
const payload = { phone: '+212600000000' };

// This should work according to the types
const token1: string = jwt.sign(payload, secret);

// This should also work with options
const token2: string = jwt.sign(payload, secret, {
  algorithm: 'HS256',
  expiresIn: '15m'
});

console.log('Type check passed');
