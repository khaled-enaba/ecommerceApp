export interface IAddress {
  _id?: string;
  userId?: string; // Optional for creation (backend will set it)
  addressLine: string;
  city: string;
  phone?: string;
  type: 'home' | 'office' | 'other';
  isDefault: boolean;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserProfile {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  role: 'USER' | 'ADMIN';
  isActive?: boolean;
  addresses?: IAddress[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPasswordChange {
  currentPassword: string;
  password: string;
  passwordConfirm: string;
}

export interface IUpdateProfile {
  name?: string;
  mobile?: string;
}
