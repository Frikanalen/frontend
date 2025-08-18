import { defineConfig } from "orval";

const NEXT_PUBLIC_DJANGO_URL = process.env.NEXT_PUBLIC_DJANGO_URL;
if (!NEXT_PUBLIC_DJANGO_URL?.length) throw new Error("NEXT_PUBLIC_DJANGO_URL is not set");

export default defineConfig({
  django: {
    input: "./django-api.yaml",
    output: {
      target: "./src/generated",
      client: "react-query",
      mode: "tags-split",
      mock: true,
      override: {
        mutator: {
          path: "./src/api/mutator/customAxios.ts",
          name: "customAxios",
        },
      },
    },
    hooks: {
      afterAllFilesWrite: "prettier --write",
    },
  },

  djangoSsr: {
    input: "./django-api.yaml",
    output: {
      target: "./src/generated/ssr",
      client: "fetch",
      mode: "tags-split",
      mock: true,
      baseUrl: NEXT_PUBLIC_DJANGO_URL,
      override: {
        // Prefix "ssr"; operationId if present; else build from verb+route
        operationName: (op, route, verb) =>
          "ssr" +
          (op.operationId ?? `${verb}${route}`)
            .replace(/[{}]/g, "")
            .split(/[\/_-]/)
            .filter(Boolean)
            .map((s) => s[0].toUpperCase() + s.slice(1))
            .join(""),
      },
    },
    hooks: {
      afterAllFilesWrite: "prettier --write",
    },
  },
});
