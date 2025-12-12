import { defineConfig } from "orval";

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
