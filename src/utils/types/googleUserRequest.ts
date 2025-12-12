import { Request } from "express";

export interface GoogleUserRequest extends Request {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      picture: string;
      accessToken: string;
    };
  }
