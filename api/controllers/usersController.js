import usersModel from "../models/usersModel.js";
import emailModel from "../models/emailModel.js";
import cookie from "cookie";
import Redis from "../../redis.js";
import bcrypt from "bcrypt";
import randomatic from "randomatic";
import { config } from "dotenv";
import jwt from "jsonwebtoken";
import { getTokenFromHeader } from "../../utils.js";
const { jwt_secret } = config().parsed;

// code:
// exist user (400) -> такая почта уже есть в базе
// failed secret key (400) -> пустой ключ
// invalid secret key (400) -> ключ не совпадает с ключом redis
// success create user (200) -> юзер создан и занесен в базу
// failed data (400) -> переданы неверные поля для создания юзера
// confirm email (200) -> в ожидании подтверждении почты
// failed email (400) -> Передан неккоректный email
// cancel register (200) -> Регистрация отменена (куки и редис почищен)
// error cancel register (400) -> Регистрация не отменится, если нету куков подтверждения почты

function checkValidFields(clientEmail, clientPassword) {
  if (clientEmail === "" || clientPassword === "") {
    return {
      valid: false,
      message: {
        code: "failed data",
        message: "Передано пустое значение email или password",
      },
    };
  }

  const isValidateEmail = (email) => {
    return /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
      email
    );
  };

  if (typeof clientPassword !== "string") {
    return {
      valid: false,
      message: {
        code: "failed password",
        message: "Неправильный тип данных у пароля",
      },
    };
  }

  if (clientPassword.length < 4) {
    return {
      valid: false,
      message: {
        code: "failed password",
        message: "Пароль должно быть не менее 4 символов",
      },
    };
  }

  if (!isValidateEmail(clientEmail)) {
    return {
      valid: false,
      message: {
        code: "failed email",
        message: "Неправильный email адрес",
      },
    };
  }
  return {
    valid: true,
    message: "",
  };
}

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

      const existUser = await usersModel.checkExistUser(clientEmail);

      if (existUser) {
        res.status(400).send({
          code: "exist user",
          message: "Пользователь с этой почтой уже существует!",
        });
        return;
      }

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

        const token = jwt.sign({ email: clientEmail }, jwt_secret);

        res.status(200).json({
          code: "success create user",
          token,
          message: "Пользователь создан!",
        });
        return;
      }

      const isValidFields = checkValidFields(clientEmail, clientPassword);
      if (!isValidFields.valid) {
        res.status(400).json(isValidFields.message);
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

      await emailModel.sendSecretKey(secretKey);

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
  async cancelConfirm(req, res) {
    try {
      const email = req.cookies["confirm-email"];
      if (email) {
        res.setHeader(
          "Set-Cookie",
          cookie.serialize("confirm-email", "", {
            httpOnly: true,
            maxAge: -1,
          })
        );
        const redis = await Redis.init();
        await redis.del(email);
        res.status(200).json({
          code: "cancel register",
          message: "Вы отменили регистрацию",
        });
        return;
      }
      res.status(400).json({
        code: "error cancel register",
        message: "Ошибка в отмене регистрации!",
      });
    } catch (msg) {
      console.error(msg);
      res.status(500).json(msg);
    }
  }
  async authUser(req, res) {
    const { email: clientEmail, password: clientPassword } = req.body;
    const { valid, message } = checkValidFields(clientEmail, clientPassword);

    if (!valid) {
      res.status(400).json(message);
      return;
    }

    try {
      const existUser = await usersModel.checkExistUser(clientEmail);

      if (!existUser) {
        res.status(401).send({
          code: "no exist user",
          message: "Пользователь с таким адресом не существует!",
        });
        return;
      }

      const isEqualPassword = await bcrypt.compare(
        clientPassword,
        existUser.password
      );

      if (!isEqualPassword) {
        res.status(401).send({
          code: "invalid auth",
          message: "Неверный пароль!",
        });
        return;
      }

      function generateAndSendToken() {
        try {
          const token = jwt.sign(
            {
              email: existUser.email,
              role: existUser.role,
            },
            jwt_secret
          );
          res.status(200).json({
            code: "auth success",
            token,
            message: "Вход успешно выполнен!",
          });
        } catch (err) {
          throw err;
        }
      }

      const existToken = getTokenFromHeader(req);

      if (existToken) {
        try {
          const { email } = jwt.verify(existToken, jwt_secret);
          if (email === clientEmail) {
            res.status(401).send({
              code: "invalid auth",
              message: "Выйдите из этого аккаунта!",
            });
            return;
          }
        } catch (err) {
          generateAndSendToken();
        }
      }

      generateAndSendToken();
    } catch (msg) {
      console.error(msg);
      res.status(500).json(msg);
    }
  }
})();
