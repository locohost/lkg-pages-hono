import { Context, Next } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import type { KVNamespace } from '@cloudflare/workers-types';
import type { User, Sess } from '../types';
import {
  repoUserGetBySessionId,
  repoUserGetByUsername,
} from '../repos/user-repo';
import { repoSessionCreate, repoSessionGetById } from '../repos/session-repo';

export async function sessionAuth(c: Context, next: Next) {
  const sess = await getSessionFromCookie(c);
  if (!sess) return c.redirect('/login', 302);
  c.set('sess', sess);
  return await next();
}

export async function getSessionFromCookie(c: Context): Promise<Sess | undefined> {
  const sessId = getCookie(c, 'session');
  console.log('auth.getSessionFromCookie sessId: ', sessId);
  if (!sessId) return undefined;
  return await repoSessionGetById(c, sessId);
}

export async function getHashedPasswordAndSalt(
  plainPass: string,
  salt?: string
): Promise<{ pass: string; salt: string }> {
  if (!salt) {
    const array = new Uint32Array(16);
    salt = hexStrFromArrBuff(crypto.getRandomValues(array));
  }
  const myText = new TextEncoder().encode(plainPass + salt);
  const myDigest = await crypto.subtle.digest(
    { name: 'SHA-256' },
    myText // The data you want to hash as an ArrayBuffer
  );
  const pass = hexStrFromArrBuff(myDigest);
  return { pass, salt };
}

export async function createSession(
  c: Context,
  username: string,
  expireHrs: number
): Promise<string> {
  const d = new Date();
  const expMilliseconds = Math.round(d.getTime() + expireHrs * 60 * 60 * 1000);
  const expSeconds = expMilliseconds / 1000;
  const sessId = await repoSessionCreate(c, username, expSeconds);
  setCookie(c, 'session', sessId, {
    path: '/',
    secure: true,
    httpOnly: true,
    expires: new Date(expMilliseconds),
  });
  return sessId;
}

export async function verifyPasswordReturnUser(
  c: Context,
  username: string,
  plainPass: string
): Promise<{ user: User | null; error: string | null }> {
  const user = await repoUserGetByUsername(c, username);
  if (!user) return { user: null, error: 'Invalid username' };
  if (user.lockedReason != null && user.lockedReason.length > 0) {
    return { user, error: user.lockedReason };
  }
  const { pass } = await getHashedPasswordAndSalt(plainPass, user.salt);
  return user.pass == pass
    ? { user, error: null }
    : { user, error: 'Invalid password' };
}

function hexStrFromArrBuff(myBuffer: ArrayBuffer): string {
  const hexString = [...new Uint8Array(myBuffer)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return hexString;
}
