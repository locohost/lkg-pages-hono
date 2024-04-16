export type User = {
	email: string;
	pass: string;
	salt: string;
	created: Date;
	lastLogin: Date;
	loginFails: number;
	lockedReason: string;
	del: boolean;
}

export type Sess = {
	id: string;
	username: string;
	email: string;
}
