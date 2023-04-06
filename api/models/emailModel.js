import nodemailer from "nodemailer";
import { config } from "dotenv";

const { email_login, email_password } = config().parsed;

export default new (class UserModel {
  mailer = null;
  initTransport() {
    this.mailer = nodemailer.createTransport({
      host: "smtp.yandex.ru",
      port: 465,
      secure: true,
      auth: {
        user: email_login,
        pass: email_password,
      },
    });
  }
  async sendSecretKey(key) {
    try {
      this.initTransport();
      let info = await this.mailer.sendMail({
        from: `Fiteng 📖" <${email_login}>`, // sender address
        to: email_login, // list of receivers
        subject: "Секретный ключ для подтверждения ✔", // Subject line
        html: `<b>${key}</b>`, // html body
      });
      console.log(/ok/i.test(info.response));
    } catch (e) {
      throw {
        code: "error server",
        message: "Не удается отправить Secret Key на почту",
        error: e,
      };
    }
  }
})();
