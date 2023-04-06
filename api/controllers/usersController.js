import usersModel from "../models/usersModel.js";
import emailModel from "../models/emailModel.js";
import { createClient } from "redis";
import randomatic from "randomatic";

export default new (class UserController {
  async getAllUsers(req, res) {
    try {
      // const data = await usersModel.getAllUsers();

      const client = createClient();

      client.on("error", (err) => {
        throw {
          code: "error redis",
          message: "Отсутствует подключение к redis-server",
          error: err,
        };
      });

      await client.connect();
      const data = await client.get("bichurinet@ya.ru");
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

      const client = createClient();

      client.on("error", (err) => {
        throw {
          code: "error redis",
          message: "Отсутствует подключение к redis-server",
          error: err,
        };
      });

      await client.connect();

      if (!clientKey) {
        // TODO доделать логику подтверждения почты (redis работает)
        const secretKey = randomatic("0", 5);
        await client.set("bichurinet@ya.ru", secretKey.toString());
        await client.expire("bichurinet@ya.ru", 10);
        res.status(200).json({
          message: "good",
        });
      }

      // const secretKey = "190545";
      // await emailModel.sendSecretKey(secretKey);
    } catch (msg) {
      console.error(msg);
      res.status(500).json(msg);
    }
  }
})();
