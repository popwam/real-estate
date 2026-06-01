import { Injectable } from '@nestjs/common';
import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(scryptCallback);

@Injectable()
export class HashService {
  private readonly keyLength = 64;

  async hash(value: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = (await scrypt(value, salt, this.keyLength)) as Buffer;

    return `scrypt:${salt}:${derivedKey.toString('hex')}`;
  }

  async verify(value: string, storedHash: string | null | undefined) {
    if (!storedHash) {
      return false;
    }

    const [algorithm, salt, key] = storedHash.split(':');

    if (algorithm !== 'scrypt' || !salt || !key) {
      return false;
    }

    const storedKey = Buffer.from(key, 'hex');
    const derivedKey = (await scrypt(value, salt, storedKey.length)) as Buffer;

    return (
      storedKey.length === derivedKey.length &&
      timingSafeEqual(storedKey, derivedKey)
    );
  }

  fingerprint(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }
}
