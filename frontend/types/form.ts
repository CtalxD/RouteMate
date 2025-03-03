export type DocumentFormData = {
  id: number;
  licenseNumber: number;
  blueBookImage: string[];
  vehicleImage: string[];
  productionYear: number;
  userId: number;
  adminComment?: string;
};

export type LoginFormData = {
  email: string;
  password: string;
};

export type RegisterFormData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  age: number;
};

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export interface ErrorResponse {
  error: boolean;
  msg: string;
}

export type ForgotPasswordFormData = {
  email: string;
};

export interface ForgotPasswordResponse {
  password: string;
}