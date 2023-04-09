import { createClient } from "redis";

export default class Redis {
  static redis = null;

  static async init() {
    if (!this.redis) {
      this.redis = createClient();
      await this.redis.connect();
      this.redis.on("error", (err) => {
        throw {
          code: "error redis",
          message: "Отсутствует подключение к redis-server",
          error: err,
        };
      });
      return this.redis;
    }
    return this.redis;
  }
}
