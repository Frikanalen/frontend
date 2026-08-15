import { defineConfig } from "orval";

export default defineConfig({
  django: {
    input: "./django-api.yaml",
    output: {
      target: "./src/generated",
      client: "react-query",
      // Orval 8 changed the default httpClient from axios to fetch; pin it so
      // the generated client keeps matching the customAxios mutator below.
      httpClient: "axios",
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
      baseUrl: "",
      override: {
        mutator: {
          path: "./src/api/mutator/serverFetch.ts",
          name: "serverFetch",
        },
        // Prefix "ssr"; operationId if present; else build from verb+route.
        // The annotation matters: orval types operationId as `any`, which
        // would otherwise leave every link in the chain below untyped.
        operationName: (op, route, verb) => {
          const base: string = op.operationId ?? `${verb}${route}`;
          return (
            "ssr" +
            base
              .replace(/[{}]/g, "")
              .split(/[\/_-]/)
              .filter(Boolean)
              .map((s) => s[0].toUpperCase() + s.slice(1))
              .join("")
          );
        },
      },
    },
    hooks: {
      afterAllFilesWrite: "prettier --write",
    },
  },
});
