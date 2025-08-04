import { defineConfig } from "orval";

export default defineConfig({
  django: {
    input: "./django-api.yaml",
    output: {
      target: "./src/generated",
      client: "react-query",
      mode: "tags-split",
      mock: true,
      baseUrl: process.env.NEXT_PUBLIC_DJANGO_URL,
    },
    hooks: {
      afterAllFilesWrite: "prettier --write",
    },
  },
});
