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
  c.set('sess', sess);
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

export async function createSession(
  c: Context,
  username: string,
  expireHrs: number
): Promise<SessResp> {
  const exp = getExpiration(expireHrs);
  const sessResp = await repoSessionCreate(c, username, exp.seconds);
  if (!sessResp.error) {
    setCookie(c, 'session', sessResp.sess!.id, {
      path: '/',
      secure: true,
      httpOnly: true,
      expires: new Date(exp.milliseconds),
    });
  }
  return sessResp;
}

export async function verifyPasswordReturnUser(
  c: Context,
  username: string,
  plainPass: string
): Promise<UserResp> {
  const userResp = await repoUserGetByUsername(c, username);
  if (userResp.error) return userResp;
  const { pass } = await getHashedPasswordAndSalt(
    plainPass,
    userResp.user!.salt
  );
  return userResp.user!.pass == pass
    ? { user: userResp.user }
    : { error: Err.BadPass };
}

export async function sendPostmark(
  c: Context,
  to: string,
  subject: string,
  body: string
) {
  const serverTkn = c.env.PM_TKN;
  const mssgs = [
    {
      From: 'admin@lateknight.games',
      To: to,
      Subject: subject,
      Tag: 'my-tag',
      HtmlBody: body,
      TextBody: body,
      MessageStream: 'broadcasts',
    },
  ];
  const resp = await fetch(`https://api.postmarkapp.com/email/batch`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Postmark-Server-Token': serverTkn,
    },
    // @ts-ignore
    body: JSON.stringify(mssgs),
  });

  const data = await resp.text();
  console.log('sendEmail resp: ', data);
}

export async function sendEmail(
  c: Context,
  to: string,
  subject: string,
  body: string
) {
  //console.log('mgCreds: ', mgCreds);
  const mgCreds = c.env.MG_CREDS;
  const form = new FormData();
  form.append('from', 'mark@mg.lateknight.games');
  form.append('to', to);
  form.append('subject', subject);
  form.append('html', body);
  // https://api.mailgun.net/v3/{domain_name}/messages
  const domainName = 'mg.lateknight.games';
  //const auth = Buffer.from(mgCreds).toString('base64');
  console.log('sendEmail creds: ', mgCreds);
  console.log('sendEmail form: ', form);
  const resp = await fetch(
    `https://api.mailgun.net/v3/${domainName}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + mgCreds,
      },
      // @ts-ignore
      body: form,
    }
  );

  const data = await resp.text();
  console.log('sendEmail resp: ', data);
}

function hexStrFromArrBuff(myBuffer: ArrayBuffer): string {
  const hexString = [...new Uint8Array(myBuffer)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return hexString;
}
