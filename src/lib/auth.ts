import { Context, Next } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import type { UserResp, SessResp } from '../types';
import { Err } from '../constants';
import { repoUserGetByUsername } from '../repos/user-repo';
import { repoSessionCreate, repoSessionGetById } from '../repos/session-repo';

export function getExpiration(hrs: number): {
  seconds: number;
  milliseconds: number;
} {
  const d = new Date();
  const expMilliseconds = Math.round(d.getTime() + hrs * 60 * 60 * 1000);
  const expSeconds = expMilliseconds / 1000;
  return { seconds: expSeconds, milliseconds: expMilliseconds };
}

export async function sessionAuth(c: Context, next: Next) {
  const sess = await getSessionFromCookie(c);
  if (!sess) return c.redirect('/auth/login', 302);
  c.set('sess', sess.sess);
  return await next();
}

export async function getSessionFromCookie(c: Context): Promise<SessResp> {
  const sessId = getCookie(c, 'session');
  console.log('auth.getSessionFromCookie sessId: ', sessId);
  if (!sessId) return { error: 'Invalid session cookie' };
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

// export async function createSession(
//   c: Context,
//   username: string,
//   expireHrs: number
// ): Promise<SessResp> {
//   const exp = getExpiration(expireHrs);
//   const sessResp = await repoSessionCreate(c, username, exp.seconds);
//   if (!sessResp.error) {
//     setCookie(c, 'session', sessResp.sess!.id, {
//       path: '/',
//       secure: true,
//       httpOnly: true,
//       expires: new Date(exp.milliseconds),
//     });
//   }
//   return sessResp;
// }

export async function verifyPasswordReturnUser(
  c: Context,
  username: string,
  plainPass: string
): Promise<UserResp> {
  const userResp = await repoUserGetByUsername(c, username);
  console.log('verifyPasswordReturnUser user: ', userResp.user);
  if (userResp.user) {
    const { pass } = await getHashedPasswordAndSalt(
      plainPass,
      userResp.user.salt
    );
    if (userResp.user.pass == pass) return { user: userResp.user };
  }
  return userResp;
}

function hexStrFromArrBuff(myBuffer: ArrayBuffer): string {
  const hexString = [...new Uint8Array(myBuffer)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return hexString;
}
