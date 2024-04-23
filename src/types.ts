export type User = {
  handle: string;
  email: string;
  emailVerified: boolean;
  verifyTkn: string;
  pass: string;
  salt: string;
  lastLogin: Date | null;
  lastLoginIp: string | null;
  loginFails: number | 0;
  lockedReason: string | null;
  created: Date;
  updated: Date | null;
  del: boolean | false;
};

export type UserResp = {
  user?: User;
  error?: string;
};

export type UserUpdate = {
  handle?: string;
  email?: string;
  emailVerified?: boolean;
  verifyTkn?: string;
  pass?: string;
  salt?: string;
  lastLogin?: Date;
  lastLoginIp?: string;
  loginFails?: number;
  lockedReason?: string;
  created?: Date;
  updated?: Date;
  del?: boolean;
};

export type Log = {
  type: string;
  message: string;
  requestIp: string | null;
  created: Date;
  del: boolean | false;
};

export type Sess = {
  id: string;
  username: string;
  email: string;
};

export type SessResp = {
  sess?: Sess;
  error?: string;
};

export type Env = {
  SITE_URL_DEV: string;
  SITE_URL_PROD: string;
  MG_CREDS: string;
  PM_TKN: string;
  ASSETS: Fetcher;
  SESSION: KVNamespace;
  SESS_SECRET: string;
  SALT: string;
  TS_SITEKEY: string;
  TS_SECRET: string;
};

export type Vars = {
  sess: Sess;
  csrfTkn: string;
};

export type TurnstileOutcome = {
  success: boolean;
  challenge_ts: string;
  hostname: string;
  'error-codes': string[];
  action: string;
  cdata: string;
};

// {
//   success: true;
//   challenge_ts: '2022-02-28T15:14:30.096Z';
//   hostname: 'example.com';
//   'error-codes': [];
//   action: 'login';
//   cdata: 'sessionid-123456789';
// }
