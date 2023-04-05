import usersModel from "../models/usersModel.js";

export default new (class UserController {
  async getAllUsers(req, res) {
    try {
    } catch (e) {
      res.status(500).json({
        message: "Ошибка сервера: не удалось вытащить пользователей с базы",
      });
    }
    const data = await usersModel.getAllUsers();
    res.status(200).json({ data });
  }
  getUser(req, res) {
    const id = req.params.id;
    const message = "get user" + " " + id;
    res.status(200).json({ message });
  }
})();
