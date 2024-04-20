export type User = {
  handle: string;
  email: string;
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

export type UserUpdate = {
  handle?: string;
  email?: string;
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

export type Env = {
  ASSETS: Fetcher;
  SESSION: KVNamespace;
  SESS_SECRET: string;
  SALT: string;
};

export type Vars = {
  sess: Sess;
  csrfTkn: string;
};
