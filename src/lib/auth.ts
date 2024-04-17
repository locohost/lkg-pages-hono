import { Context, Next } from 'hono';
import type { KVNamespace } from '@cloudflare/workers-types';
import { getCookie, setCookie } from 'hono/cookie';
import type { User, Sess } from '../types';

export async function sessionAuth(c: Context, next: Next) {
  const sess = await getSessionFromCookie(c, 'SESSION');
  if (sess == null) return c.redirect('/login', 302);
  c.set('sess', sess);
  return await next();
}

export async function getSessionFromCookie(
  c: Context,
  kvNamespace: string
): Promise<Sess | null> {
  const sessId = getCookie(c, 'session');
  console.log('auth.getSession sessId: ', sessId);
  if (sessId == null) return null;
  const username = await c.env[kvNamespace].get(`SESS:${sessId}`);
	if (username == null) return null;
  const userStr = await c.env[kvNamespace].get(`USER:${username}`);
	if (userStr == null) return null;
  const user = JSON.parse(userStr) as User;
	///TODO: Check user.lockedReason and user.del
  return { id: sessId, username: username, email: user.email } as Sess;
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

export async function createUser(
  c: Context,
  kvNamespace: string,
  username: string,
  email: string,
  plainPass: string
) {
  // Save new User to KV
  const KV = c.env[kvNamespace] as KVNamespace;
  const { pass, salt } = await getHashedPasswordAndSalt(plainPass);
  const user: User = {
    email,
    pass,
    salt,
    loginFails: 0,
    lastLoginIp: null,
    lastLogin: new Date(),
    lockedReason: null,
    created: new Date(),
    updated: null,
    del: false,
  };
  console.log('auth.createUser user: ', user);
  await KV.put(`USER:${username}`, JSON.stringify(user));
}

export async function createSession(
  c: Context,
  kvNamespace: string,
  username: string,
  expireHrs: number
): Promise<string> {
  const KV = c.env[kvNamespace] as KVNamespace;
  const sessId = crypto.randomUUID();
  const d = new Date();
  const expMilliseconds = Math.round(d.getTime() + expireHrs * 60 * 60 * 1000);
  const expSeconds = expMilliseconds / 1000;
  setCookie(c, 'session', sessId, {
    path: '/',
    secure: true,
    httpOnly: true,
    expires: new Date(expMilliseconds),
  });
  await KV.put(`SESS:${sessId}`, username, { expiration: expSeconds });
  return sessId;
}

export async function verifyPasswordEnteredGetUser(
  c: Context,
  kvNamespace: string,
  username: string,
  plainPass: string
): Promise<{ user: User | null; error: string | null }> {
  const KV = c.env[kvNamespace] as KVNamespace;
  const userStr = await KV.get(`USER:${username}`);
  if (userStr == null) {
    return { user: null, error: 'Invalid username' };
  }
  const user = JSON.parse(userStr) as User;
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
