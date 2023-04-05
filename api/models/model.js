import Database from "../../database.js";

export default class Model {
  async initDB() {
    return await Database.init();
  }
}
