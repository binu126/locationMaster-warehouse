import { body, param, query } from "express-validator";

export const createLocationValidator = [
  body("code").notEmpty().withMessage("Code is required"),
  body("name").notEmpty().withMessage("Name is required"),
  body("type").notEmpty().withMessage("Type is required"),
  body("capacity").isInt({ min: 1 }).withMessage("Capacity must be > 0"),
  body("usedCapacity")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Used capacity must be >= 0"),
  body("temperatureControlled").optional().isBoolean(),
  body("minTemperature").optional().isNumeric(),
  body("maxTemperature").optional().isNumeric(),
];

export const updateLocationValidator = [
  param("id").isInt().withMessage("Invalid ID"),
  body("capacity").optional().isInt({ min: 1 }),
  body("usedCapacity").optional().isInt({ min: 0 }),
];

export const idParamValidator = [
  param("id").isInt().withMessage("Invalid ID"),
];

export const filterValidator = [
  query("type").optional().isString(),
  query("status").optional().isString(),
];
