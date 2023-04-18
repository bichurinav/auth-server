import Model from "./model.js";

export default new (class UserModel extends Model {
  async createUser(user) {
    try {
      const DB = await this.initDB();
      const [rows] = await DB.query(
        "INSERT INTO users (email, password) VALUES (?, ?)",
        user
      );
      return rows;
    } catch (err) {
      throw err;
    }
  }
  async checkExistUser(email) {
    try {
      const DB = await this.initDB();
      const [rows] = await DB.query("SELECT * FROM users WHERE email = ?", [
        email,
      ]);
      return rows[0];
    } catch (err) {
      throw err;
    }
  }
})();
