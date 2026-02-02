export interface ILogin {
  email: string;
  password: string;
}

export interface ILoginResponse {
  token: string;
}

export interface IUserData {
  id: string;
  _id: string;
  name: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
  isActive: boolean;
}

export interface IUser {
  id: string,
  _id: string,
  name: string,
  role: string,
  iat: number,
  exp: number;
}

export interface IUsersRes {
  message: string;
  data: IUser[];
}

export interface IStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  revenue: number;
}