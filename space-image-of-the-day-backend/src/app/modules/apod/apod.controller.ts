import { NextFunction, Request, Response } from "express";
import logger from "../../utils/logger.js";
import { ApodService } from "./apod.service.js";

const getApod = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date, lang } = req.query;
    const result = await ApodService.getApodByDate(date as string, lang as string);
    res.status(200).json({
      success: true,
      message: "Cosmic data retrieved successfully",
      ...result,
    });
  } catch (error) {
    logger.error(
      error instanceof Error ? error : { error },
      "Error fetching APOD:",
    );
    next(error);
  }
};

const getRandomApod = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { lang } = req.query;
    const result = await ApodService.getRandomApod(lang as string);
    res.status(200).json({
      success: true,
      message: "Random discovery successful",
      ...result,
    });
  } catch (error) {
    logger.error(
      error instanceof Error ? error : { error },
      "Error fetching random APOD:",
    );
    next(error);
  }
};

export const ApodController = {
  getApod,
  getRandomApod,
};
