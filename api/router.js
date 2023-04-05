import { Router } from "express";
import usersRouter from "./routes/usersRouter.js";

const router = Router();

router.use("/users", usersRouter);

export default router;
