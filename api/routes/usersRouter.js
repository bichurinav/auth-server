import { Router } from "express";
import usersController from "../controllers/usersController.js";

const usersRouter = Router();

usersRouter.get("/", usersController.getAllUsers);
usersRouter.post("/add", usersController.createUser);

export default usersRouter;
