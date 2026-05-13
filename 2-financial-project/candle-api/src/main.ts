import cors from "cors";
import express from "express";
import morgan from "morgan";
import { config } from "./shared/config/config.js";

const app = express();

function bootstrap() {
  app.use(express.json());
  app.use(cors());
  app.use(morgan('dev'));

  app.listen(config.port, () => {
    console.log(`Listening on port ${config.port}`);
  });
}

bootstrap();
