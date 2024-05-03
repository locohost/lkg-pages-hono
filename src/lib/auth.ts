import { Context } from 'hono';
import type { UserResp, SessResp } from '../types';
import { repoUserGetByUsername } from '../repos/user-repo';

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

export async function verifyPasswordReturnUser(
  ctx: Context,
  username: string,
  plainPass: string
): Promise<UserResp> {
  const userResp = await repoUserGetByUsername(ctx, username);
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

// ============================================================================
// PRIVATE PARTS

// async function getSessionFromCookie(c: Context): Promise<SessResp> {
//   const sessId = getCookie(c, 'session');
//   console.log('auth.getSessionFromCookie sessId: ', sessId);
//   if (!sessId) return { error: 'Invalid session cookie' };
//   return await repoSessionGetById(c, sessId);
// }

function hexStrFromArrBuff(myBuffer: ArrayBuffer): string {
  const hexString = [...new Uint8Array(myBuffer)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return hexString;
}
