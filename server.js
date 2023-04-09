import express from "express";
import router from "./api/router.js";
import cookieParser from "cookie-parser";

const PORT = 3033;
const app = express();

app.use(express.json());
app.use(cookieParser());
app.use("/api", router);

app.listen(PORT, () => {
  console.log("SERVER IS STARTED", PORT);
});
