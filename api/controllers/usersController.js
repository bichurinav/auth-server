import usersModel from "../models/usersModel.js";
import emailModel from "../models/emailModel.js";
import cookie from "cookie";
import Redis from "../../redis.js";
import bcrypt from "bcrypt";

import randomatic from "randomatic";

export default new (class UserController {
  async getAllUsers(req, res) {
    try {
      // const data = await usersModel.getAllUsers();

      const redis = await Redis.init();
      const data = await redis.get("bichurinet@ya.ru");

      res.status(200).json({ data });
    } catch (msg) {
      res.status(500).json(msg);
    }
  }
  async createUser(req, res) {
    try {
      const {
        email: clientEmail,
        password: clientPassword,
        key: clientKey,
      } = req.body;

      if (req.cookies["confirm-email"] && !clientKey) {
        res.status(400).json({
          code: "failed secret key",
          message: "Неверный секретный ключ",
        });
        return;
      }

      if (req.cookies["confirm-email"]) {
        const redis = await Redis.init();
        const data = await redis.get(req.cookies["confirm-email"]);
        const dataUser = JSON.parse(data);
        if (clientKey !== dataUser.key) {
          res.status(400).json({
            code: "invalid secret key",
            message: "Неверный секретный ключ",
          });
          return;
        }

        await usersModel.createUser([
          req.cookies["confirm-email"],
          dataUser.password,
        ]);

        await redis.del(req.cookies["confirm-email"]);
        await redis.quit();

        res.setHeader(
          "Set-Cookie",
          cookie.serialize("confirm-email", "", {
            httpOnly: true,
            maxAge: -1,
          })
        );

        res.status(200).json({
          code: "success create user",
          message: "Пользователь создан!",
        });
        return;
      }

      if (clientEmail === "" || clientPassword === "") {
        res.status(400).json({
          code: "failed data",
          message: "Передано пустое значение email или password",
        });
        return;
      }

      const isValidateEmail = (email) => {
        return /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
          email
        );
      };

      if (!isValidateEmail(clientEmail)) {
        res.status(400).json({
          code: "failed email",
          message: "Неправильный email адрес",
        });
        return;
      }

      const secretKey = randomatic("0", 5);
      const hashedPassword = bcrypt.hashSync(clientPassword, 10);
      const dataUser = JSON.stringify({
        key: secretKey,
        password: hashedPassword,
      });

      const redis = await Redis.init();

      await redis.set(clientEmail, dataUser);

      await redis.expire(clientEmail, 600);

      const isSending = await emailModel.sendSecretKey(secretKey);
      console.log("Sending email:", isSending);

      res.setHeader(
        "Set-Cookie",
        cookie.serialize("confirm-email", clientEmail, {
          httpOnly: true,
          maxAge: 600,
        })
      );

      res.status(200).json({
        code: "confirm email",
        message: "Ждем подтверждения e-mail",
      });

      return;
    } catch (msg) {
      console.error(msg);
      res.status(500).json(msg);
    }
  }
})();
