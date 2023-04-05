import Model from "./model.js";

export default new (class UserModel extends Model {
  async getAllUsers() {
    const DB = await this.initDB();
    const [rows] = await DB.query("SELECT * FROM users");
    return rows;
  }
})();
