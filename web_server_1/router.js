import express from "express";

const router = express.Router();

const handleMainRoute = (request, response) => {
  response.send("welcome to web server 1").status(200);
};

router.get("/", handleMainRoute);

export default router;
