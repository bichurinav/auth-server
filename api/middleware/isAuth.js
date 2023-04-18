import { getTokenFromHeader } from "../../utils.js";
import usersModel from "../models/usersModel.js";
import jwt from "jsonwebtoken";
import { config } from "dotenv";
const { jwt_secret } = config().parsed;

export default async (req, res, next) => {
  const token = getTokenFromHeader(req);
  try {
    const { email } = jwt.verify(token, jwt_secret);
    const user = await usersModel.checkExistUser(email);
    if (!user) {
      throw "Данного пользователя не существует!";
    }
    req.role = user.role;
    next();
  } catch (err) {
    res.status(401).json({
      code: "invalid auth",
      message: err,
    });
  }
};
