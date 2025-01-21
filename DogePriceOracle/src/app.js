import express from 'express';
import priceRouter from './routes/price.route.js';

const app = express();


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/price",priceRouter)

export default app