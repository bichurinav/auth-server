import express from "express";
import router from "./api/router.js";

const PORT = 3033;
const app = express();

app.use(express.json());
app.use("/api", router);

app.listen(PORT, () => {
  console.log("SERVER IS STARTED", PORT);
});
