import { Router, type Request, type Response } from "express";
import Activity from "../models/activity.js";

interface QueryParams {
   name?: string,
   age?: number
}

const productRouter = Router();

productRouter.get("/", async (req: Request<{}, {}, {}, QueryParams>, res: Response) => {
    try {
        const { name, age } = req.query;

        // 1. Create an empty query search object
        const databaseQuery: any = {};

        // 2. If 'name' is provided in the URL, search for it (case-insensitive)
        if (name) {
            // "i" means case-insensitive (so "John" and "john" both match)
            databaseQuery.name = new RegExp(name, "i");
        }

        // 3. If 'age' is provided in the URL, search for it
        if (age) {
            databaseQuery.age = Number(age); // Ensure it's a number
        }

        // 4. Ask MongoDB to find the matching records and WAIT for the database to respond
        const filteredProducts = await Activity.find(databaseQuery);

        // 5. Send the list back to the browser/client
        res.status(200).json(filteredProducts);
    } catch (err: any) {
        // If anything goes wrong, send a 500 Server Error
        res.status(500).json({ message: err.message });
    }
});

export default productRouter;