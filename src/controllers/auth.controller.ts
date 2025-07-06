import { Request, Response, NextFunction } from "express";
import * as AuthService from "../services/auth.service";
import { AppError } from "../utils/error";
import { AuthRequest } from "../middleware/auth.middleware";
import { CREATED, OK } from "../utils/http-status";

// Define consistent cookie options for tokens
const longLivedCookieOpts = {
  httpOnly: true,
  secure: true,
  sameSite: "none" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: "/",
};

const shortLivedCookieOpts = {
  httpOnly: true,
  secure: true,
  sameSite: "none" as const,
  maxAge: 15 * 60 * 1000, // 15 minutes
  path: "/",
};

// SIGN UP
const signUp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, role, age, gender, country, city } = req.body;
    const { user, accessToken, refreshToken } = await AuthService.signUp({
      name,
      email,
      password,
      role,
      age,
      gender,
      country,
      city,
    });

    // Set cookies
    res.cookie("accessToken", accessToken, longLivedCookieOpts);
    res.cookie("refreshToken", refreshToken, longLivedCookieOpts);

    res.status(CREATED).json({
      status: "success",
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          age: user.age,
          gender: user.gender,
          country: user.country,
          city: user.city,
          score: user.score,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("SIGNUP ERROR:", error);
    next(error);
  }
};

// SIGN IN
const signIn = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const { user, accessToken, refreshToken } = await AuthService.signIn(
      email,
      password
    );

    // Set cookies
    res.cookie("accessToken", accessToken, longLivedCookieOpts);
    res.cookie("refreshToken", refreshToken, longLivedCookieOpts);

    res.status(OK).json({
      status: "success",
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          age: user.age,
          gender: user.gender,
          country: user.country,
          city: user.city,
          score: user.score,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// SIGN OUT
const signOut = async (req: Request, res: Response) => {
  // Clear cookies by setting expiration in the past
  res.cookie("accessToken", "", { expires: new Date(0), ...longLivedCookieOpts });
  res.cookie("refreshToken", "", { expires: new Date(0), ...longLivedCookieOpts });

  res.status(OK).json({
    status: "success",
    message: "Signed out successfully",
  });
};

// REFRESH TOKENS
const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.refreshToken || req.body.refreshToken;
    if (!token) throw new AppError("Refresh token not provided", 401);

    const tokens = await AuthService.refreshToken(token);

    // Set new cookies
    res.cookie("accessToken", tokens.accessToken, longLivedCookieOpts);
    res.cookie("refreshToken", tokens.refreshToken, longLivedCookieOpts);

    res.status(OK).json({
      status: "success",
      data: tokens,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE ACCOUNT
const deleteAccount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    await AuthService.deleteAccount(req.user.id);

    // Clear cookies
    res.cookie("accessToken", "", { expires: new Date(0), ...longLivedCookieOpts });
    res.cookie("refreshToken", "", { expires: new Date(0), ...longLivedCookieOpts });

    res.status(OK).json({
      status: "success",
      message: "Account deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export { signUp, signIn, signOut, refreshToken, deleteAccount };
