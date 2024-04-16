import { Context, Next } from "hono";
import type { KVNamespace } from "@cloudflare/workers-types";
import { getCookie, setCookie } from "hono/cookie";
import type { User, Sess } from "./types";

export async function sessionAuth(c: Context, next: Next) {
  const sessId = getCookie(c, "session");
  console.log("sessionAuth sessId: ", sessId);
  if (sessId == null) {
    return c.redirect("/login", 302);
  }
  const username: string = await c.env.SESSION.get(`SESS:${sessId}`);
  const userStr: string = await c.env.SESSION.get(`USER:${username}`);
  const user: User = userStr != null ? JSON.parse(userStr) : null;
  const sess = { id: sessId, username: username, email: user.email } as Sess;
  c.set("sess", sess);
  return await next();
}

export async function hashPassword(
  plainPass: string,
  salt?: string
): Promise<{ pass: string; salt: string }> {
  if (!salt) {
    const array = new Uint32Array(16);
    salt = hexStrFromArrBuff(crypto.getRandomValues(array));
  }
  const myText = new TextEncoder().encode(plainPass + salt);
  const myDigest = await crypto.subtle.digest(
    { name: "SHA-256" },
    myText // The data you want to hash as an ArrayBuffer
  );
  const pass = hexStrFromArrBuff(myDigest);
  return { pass, salt };
}

export async function createUser(
  cfKV: KVNamespace,
  username: string,
  email: string,
  plainPass: string
) {
  // Save new User to KV
  const { pass, salt } = await hashPassword(plainPass);
  const user: User = {
    email,
    pass,
    salt,
    created: new Date(),
    loginFails: 0,
    lastLogin: new Date(),
    lockedReason: "",
    del: false,
  };
  console.log("user", user);
  await cfKV.put(`USER:${username}`, JSON.stringify(user));
}

export async function createSession(
  c: Context,
  cfKV: KVNamespace,
  username: string,
  expireHrs: number
): Promise<string> {
  const sessId = crypto.randomUUID();
  // Expire session in 3 hrs
  const d = new Date();
  const expMilliseconds = Math.round(d.getTime() + expireHrs * 60 * 60 * 1000);
  const expSeconds = expMilliseconds / 1000;
  setCookie(c, "session", sessId, {
    path: "/",
    secure: true,
    httpOnly: true,
    expires: new Date(expMilliseconds),
  });
  await cfKV.put(`SESS:${sessId}`, username, {
    expiration: expSeconds,
  });
  return sessId;
}

function hexStrFromArrBuff(myBuffer: ArrayBuffer): string {
  const hexString = [...new Uint8Array(myBuffer)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hexString;
}
