import { Router, type Request, type Response } from "express";
import mongoose from "mongoose";
import Activity, { type IActivity } from "../models/activity.js";

interface QueryParams {
  name?: string;
  age?: string; // Express parses URL query params as strings or arrays of strings
}

const productRouter = Router();

// Helper function to escape special RegExp characters to prevent ReDoS
const escapeRegex = (str: string) =>
  str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

productRouter.get(
  "/",
  async (req: Request<{}, {}, {}, QueryParams>, res: Response) => {
    try {
      const { name, age } = req.query;

      // Fully typed search query matching the Activity schema!
      const databaseQuery: mongoose.QueryFilter<IActivity> = {};

      if (name) {
        databaseQuery.name = { $regex: escapeRegex(name), $options: "i" };
      }

      if (age) {
        const parsedAge = Number(age);
        if (!isNaN(parsedAge)) {
          databaseQuery.age = parsedAge;
        }
      }

      // Using .lean() for high-performance, read-only JSON responses
      const filteredProducts = await Activity.find(databaseQuery).lean();

      res.status(200).json(filteredProducts);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Internal Server Error" });
    }
  },
);

productRouter.get(
  "/:id",
  async (req: Request<{ id: string }>, res: Response) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid product ID format" });
      }

      const product = await Activity.findById(id).lean();

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.status(200).json(product);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Internal Server Error" });
    }
  },
);

// Add a POST route to create new activities (supports both single object and bulk array)
productRouter.post("/", async (req: Request, res: Response) => {
  try {
    const body = req.body;

    // If the body is an array, do a bulk insert using insertMany!
    if (Array.isArray(body)) {
      const savedActivities = await Activity.insertMany(body);
      return res.status(201).json(savedActivities);
    }

    // Otherwise, insert a single document
    const { name, age } = body;
    const newActivity = new Activity({
      name,
      age,
    });

    // 2. Save it to the database
    const savedActivity = await newActivity.save();

    // 3. Return the saved document with a 201 Created status
    res.status(201).json(savedActivity);
  } catch (err: any) {
    res
      .status(400)
      .json({ message: err.message || "Failed to create activity" });
  }
});

export default productRouter;
