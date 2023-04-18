import { Router } from "express";
import usersController from "../controllers/usersController.js";
import isAuth from "../middleware/isAuth.js";

const usersRouter = Router();

usersRouter.get("/", usersController.getAllUsers);
usersRouter.post("/create", usersController.createUser);
usersRouter.post("/auth", usersController.authUser);
usersRouter.get("/cancel-confirm", usersController.cancelConfirm);
usersRouter.get("/test", isAuth, (req, res) => {
  res.status(200).json({
    message: `Круто, ты ${req.role}`,
  });
});

export default usersRouter;
