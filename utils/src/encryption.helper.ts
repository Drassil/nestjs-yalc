import * as crypto from 'crypto';

export const encryptAes = (toEncrypt: string, key: string) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    'aes-256-ctr',
    Buffer.from(key, 'hex'),
    iv,
  );
  let encrypted = cipher.update(toEncrypt, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
};

export const decryptAes = (toDecrypt: string, key: string) => {
  if (toDecrypt === '') {
    return '';
  }
  const split = toDecrypt.split(':');
  const iv = split[0];
  const decipher = crypto.createDecipheriv(
    'aes-256-ctr',
    Buffer.from(key, 'hex'),
    Buffer.from(iv, 'hex'),
  );
  let decrypted = decipher.update(split[1], 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};
