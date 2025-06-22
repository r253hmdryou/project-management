import { serve } from "@hono/node-server";
import {
  PrismaClient,
  type Document,
  type Product,
} from "../prisma/generated/client/index.js";
import { Hono } from "hono";
import { v4 } from "uuid";
import { z } from "zod";
import { productSchema } from "./schema/product.js";
import { documentSchema } from "./schema/document.js";
import { conflictException, notFoundException } from "./lib/exception.js";

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
  const schema = productSchema.pick({
    name: true,
    key: true,
    instruction: true,
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

app.get("/products/:key/documents", async (c) => {
  const schema = productSchema.pick({ key: true });
  const { key } = schema.parse(c.req.param());

  const documents = await prisma.document.findMany({
    where: {
      product: {
        key,
      },
    },
  });

  return c.json(
    documents.map((doc) => ({
      name: doc.name,
      path: doc.path,
      instruction: doc.instruction,
    }))
  );
});

app.post("/products/:key/documents", async (c) => {
  const paramSchema = productSchema.pick({ key: true });
  const { key } = paramSchema.parse(c.req.param());

  const bodySchema = documentSchema.pick({
    name: true,
    path: true,
    content: true,
    instruction: true,
  });
  const { name, path, content, instruction } = bodySchema.parse(
    await c.req.json()
  );

  const product = await prisma.product.findUnique({
    where: {
      key,
    },
  });

  if (!product) {
    c.status(404);
    return c.json(notFoundException(`Product with key "${key}" not found.`));
  }

  if (
    await prisma.document.findUnique({
      where: {
        path_productId: {
          path,
          productId: product.id,
        },
      },
    })
  ) {
    c.status(409);
    return c.json(
      conflictException(
        `Document with product "${key}" and path "${path}" already exists. document content did not change. If you want to update the document, please use the PUT method.`
      )
    );
  }

  const uuid = v4();
  const document = await prisma.document.create({
    data: {
      uuid,
      name,
      path,
      content,
      productId: product.id,
      instruction,
    },
  });

  return c.json(toDocumentDetailResponse(document));
});

app.put("/products/:key/documents/:path", async (c) => {
  const paramSchema = z.object({
    key: z.string().min(1),
    path: z.string().min(1),
  });
  const { key, path } = paramSchema.parse(c.req.param());

  const bodySchema = documentSchema.pick({
    name: true,
    content: true,
    instruction: true,
  });
  const { name, content, instruction } = bodySchema.parse(await c.req.json());

  const product = await prisma.product.findUnique({
    where: {
      key,
    },
  });

  if (!product) {
    c.status(404);
    return c.json(notFoundException(`Product with key "${key}" not found.`));
  }

  const document = await prisma.document.findUnique({
    where: {
      path_productId: {
        path,
        productId: product.id,
      },
    },
  });

  if (!document) {
    c.status(404);
    return c.json(notFoundException(`Document with path "${path}" not found.`));
  }

  const updatedDocument = await prisma.document.update({
    where: {
      id: document.id,
    },
    data: {
      name,
      content,
      instruction,
    },
  });

  return c.json(toDocumentDetailResponse(updatedDocument));
});

app.get("/products/:key/documents/:path", async (c) => {
  const paramSchema = z.object({
    key: z.string().min(1),
    path: z.string().min(1),
  });
  const { key, path } = paramSchema.parse(c.req.param());

  const product = await prisma.product.findUnique({
    where: {
      key,
    },
  });

  if (!product) {
    c.status(404);
    return c.json(notFoundException(`Product with key "${key}" not found.`));
  }

  const document = await prisma.document.findUnique({
    where: {
      path_productId: {
        path,
        productId: product.id,
      },
    },
  });

  if (!document) {
    c.status(404);
    return c.json(notFoundException(`Document with path "${path}" not found.`));
  }

  return c.json(toDocumentDetailResponse(document));
});

function toProductResponse(product: Product) {
  return {
    name: product.name,
    key: product.key,
    instruction: product.instruction,
  };
}

function toDocumentDetailResponse(document: Document) {
  return {
    name: document.name,
    path: document.path,
    instruction: document.instruction,
    content: document.content,
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
