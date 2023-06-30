export default {
    "fkapi": {
        input: "./fkapi.json",
        output: {
            mode: "tags-split",
            target: "src/generated/fk-api-axios.ts",
            schemas: "src/generated/model",
            client: "react-query",
            override: {
                mutator: {
                    path: "./src/modules/orval/fk-api-axios.ts",
                    name: "axiosInstance",
                },
                useDates: true,
            },
            mock: true,
        },
        hooks: {
            afterAllFilesWrite: "prettier --write",
        },
    },
};