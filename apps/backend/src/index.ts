import { Hono } from "hono/quick";
import { PrismaClient } from "@prisma/client";

const app = new Hono();
const prisma = new PrismaClient();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.get("/projects", async (c) => {
  const projects = await prisma.project.findMany({
    select: {
      uuid: true,
      name: true,
      instruction: true,
    },
  });
  return c.json(projects);
});

app.fire();
