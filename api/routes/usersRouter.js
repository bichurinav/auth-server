import { Router } from "express";
import usersController from "../controllers/usersController.js";

const usersRouter = Router();

usersRouter.get("/", usersController.getAllUsers);
usersRouter.get("/:id", usersController.getUser);

export default usersRouter;
