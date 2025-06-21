import { serve } from "@hono/node-server";
import { Hono } from "hono/quick";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { v4 } from "uuid";

const app = new Hono();
const prisma = new PrismaClient();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.get("/projects", async (c) => {
  const projects = await prisma.project.findMany({
    select: {
      uuid: true,
      key: true,
      name: true,
      instruction: true,
    },
  });
  return c.json(projects);
});

app.post("/projects", async (c) => {
  const schema = z.object({
    name: z.string().min(1),
    key: z.string().min(1).max(10),
    instruction: z.string().default(""),
  });
  const body = schema.parse(await c.req.json());
  const uuid = v4();
  const project = await prisma.project.create({
    data: {
      uuid,
      ...body,
    },
  });
  return c.json(project);
});

serve(
  {
    fetch: app.fetch,
    port: 39605,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);
