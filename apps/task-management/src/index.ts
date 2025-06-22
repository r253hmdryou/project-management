import { serve } from "@hono/node-server";
import { Hono } from "hono/quick";
import {
  PrismaClient,
  type Project,
} from "../prisma/generated/client/index.js";
import { z } from "zod";
import { v4 } from "uuid";
import { conflictException } from "./libs/exception.js";

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
  const { name, key, instruction } = schema.parse(await c.req.json());

  if (await prisma.project.findUnique({ where: { key } })) {
    c.status(409);
    return c.json(
      conflictException(`Project with key "${key}" already exists.`)
    );
  }

  const uuid = v4();
  const project = await prisma.project.create({
    data: {
      uuid,
      name,
      key,
      instruction,
    },
  });
  return c.json(toProjectResponse(project));
});

function toProjectResponse(project: Project) {
  return {
    uuid: project.uuid,
    key: project.key,
    instruction: project.instruction,
  };
}

serve(
  {
    fetch: app.fetch,
    port: 39605,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);
