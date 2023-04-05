class UserController {
  getAllUsers(req, res) {
    res.status(200).json({ message: "all users" });
  }
  getUser(req, res) {
    const id = req.params.id;
    const message = "get user" + " " + id;
    res.status(200).json({ message });
  }
}

export default new UserController();
