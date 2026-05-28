import { Router, type Request, type Response } from "express";
import mongoose from "mongoose";
import Activity, { type IActivity } from "../models/activity.js";

interface QueryParams {
  name?: string;
  age?: string; // Express parses URL query params as strings or arrays of strings
  minAge?: string;
  maxAge?: string;
}

interface MongoNumberOperators {
  $gte?: number;
  $lte?: number;
  $gt?: number;
  $lt?: number;
}

interface PatchProductBody {
  name?: string;
  age?: number;
}

const productRouter = Router();

// Helper function to escape special RegExp characters to prevent ReDoS
const escapeRegex = (str: string) =>
  str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

productRouter.get(
  "/",
  async (req: Request<{}, {}, {}, QueryParams>, res: Response) => {
    try {
      const { name, age, minAge, maxAge } = req.query;

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
      } else if (minAge || maxAge) {
        const ageFilter: MongoNumberOperators = {};

        if (minAge) {
          const parsedMin = Number(minAge);
          if (!isNaN(parsedMin)) {
            ageFilter.$gte = parsedMin;
          }
        }

        if (maxAge) {
          const parsedMax = Number(maxAge);
          if (!isNaN(parsedMax)) {
            ageFilter.$lte = parsedMax;
          }
        }

        if (Object.keys(ageFilter).length > 0) {
          databaseQuery.age = ageFilter; // Fully type-safe mapping without using 'as any'
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
    if (err.name === "ValidationError" || err.name === "CastError") {
      return res.status(400).json({
        message: "Validation failed",
        details: err.message,
      });
    }
    if (err.code === 11000) {
      return res.status(400).json({
        message: "Duplicate key error: product already exists.",
      });
    }
    console.error("Unexpected error in POST route:", err);
    res.status(500).json({
      message: "An unexpected internal server error occurred",
    });
  }
});

productRouter.patch(
  "/:id",
  async (req: Request<{ id: string }, {}, PatchProductBody>, res: Response) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid product ID format" });
      }

      const { name, age } = req.body;

      // Fail early if no fields were provided for updating
      if (name === undefined && age === undefined) {
        return res.status(400).json({
          message: "At least one field (name or age) must be provided for update",
        });
      }

      const product = await Activity.findById(id);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (name !== undefined) {
        product.name = name;
      }

      if (age !== undefined) {
        product.age = age;
      }

      const updatedProduct = await product.save();

      res.status(200).json(updatedProduct);
    } catch (err: any) {
      if (err.name === "ValidationError" || err.name === "CastError") {
        return res.status(400).json({
          message: "Validation failed",
          details: err.message,
        });
      }
      if (err.code === 11000) {
        return res.status(400).json({
          message: "Duplicate key error: product already exists.",
        });
      }
      console.error("Unexpected error in PATCH route:", err);
      res.status(500).json({
        message: "An unexpected internal server error occurred",
      });
    }
  }
);

// DELETE a product by ID
productRouter.delete(
  "/:id",
  async (req: Request<{ id: string }>, res: Response) => {
    try {
      const { id } = req.params;

      // Validate that the ID is a valid MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid product ID format" });
      }

      // Try to find and delete the product in a single step
      // findByIdAndDelete returns the document that was deleted, or null if not found
      const deletedProduct = await Activity.findByIdAndDelete(id).lean();

      // If no product was found with that ID, return a 404 Not Found error
      if (!deletedProduct) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Return a 204 No Content status on successful deletion
      res.status(204).send();
    } catch (err: any) {
      // Handle potential server errors (e.g., database issues)
      console.error("Error deleting product:", err);
      res.status(500).json({
        message: "An unexpected internal server error occurred"
      });
    }
  }
);

export default productRouter;
