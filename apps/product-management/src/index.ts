import { serve } from "@hono/node-server";
import {
  PrismaClient,
  type Product,
} from "../prisma/generated/client/index.js";
import { Hono } from "hono";
import { v4 } from "uuid";
import { z } from "zod";

const app = new Hono();
const prisma = new PrismaClient();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.get("/products", async (c) => {
  const products = await prisma.product.findMany();
  return c.json(products.map(toProductResponse));
});

app.post("/products", async (c) => {
  const schema = z.object({
    name: z.string().min(1),
    key: z.string().min(1).max(10),
    instruction: z.string().default(""),
  });
  const { name, key, instruction } = schema.parse(await c.req.json());

  if (await prisma.product.findUnique({ where: { key } })) {
    c.status(409);
    return c.json({
      statusCode: 409,
      message: `Product with key "${key}" already exists.`,
    });
  }

  const uuid = v4();
  const product = await prisma.product.create({
    data: {
      uuid,
      name,
      key,
      instruction,
    },
  });
  return c.json(toProductResponse(product));
});

function toProductResponse(product: Product) {
  return {
    name: product.name,
    key: product.key,
    instruction: product.instruction,
  };
}

serve(
  {
    fetch: app.fetch,
    port: 39606,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);
