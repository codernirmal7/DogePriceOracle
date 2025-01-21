import { Router } from "express";
import { updateDogePrice } from "../controllers/price.controller.js";

const priceRouter = Router();

priceRouter.route("/update").get(updateDogePrice);


export default priceRouter