import mysql from "mysql2/promise";
import dotenv from "dotenv";

const config = dotenv.config().parsed;

class Database {
  static DB = null;

  static async init() {
    if (!this.DB) {
      try {
        const conn = await mysql.createConnection({
          host: "localhost",
          user: config["db_user"],
          password: config["db_password"],
          database: config["db_name"],
        });
        return (this.DB = conn);
      } catch (e) {
        throw e;
      }
    }
    return this.DB;
  }
}

export default Database;
