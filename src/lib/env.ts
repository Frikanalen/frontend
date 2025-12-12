import { isServer } from "@tanstack/react-query";
import * as z from "zod";

const EnvSchema = z.object({
  DJANGO_URL: z.url(),
});

export const env = isServer
  ? EnvSchema.parse({
      DJANGO_URL: process.env.DJANGO_URL,
    })
  : {
      DJANGO_URL: "/api/",
    };
