/**
 * Generated by orval v6.16.0 🍺
 * Do not edit manually.
 * Frikanalen API
 * RESTful API for consuming and interacting with Frikanalen
 * OpenAPI spec version: 2.0.0
 */
import { rest } from "msw"
import { faker } from "@faker-js/faker"

export const getNewVideoMock = () => ({
  id: faker.datatype.number({ min: undefined, max: undefined }),
  title: faker.random.word(),
  description: faker.random.word(),
  duration: faker.datatype.number({ min: undefined, max: undefined }),
  categories: Array.from({ length: faker.datatype.number({ min: 1, max: 10 }) }, (_, i) => i + 1).map(() =>
    faker.datatype.number({ min: undefined, max: undefined })
  ),
  createdAt: `${faker.date.past().toISOString().split(".")[0]}Z`,
  updatedAt: `${faker.date.past().toISOString().split(".")[0]}Z`,
  organization: {
    id: faker.datatype.number({ min: undefined, max: undefined }),
    name: faker.random.word(),
    description: faker.helpers.arrayElement([faker.random.word(), undefined]),
    homepage: faker.helpers.arrayElement([faker.internet.url(), undefined]),
    postalAddress: faker.helpers.arrayElement([faker.random.word(), undefined]),
    streetAddress: faker.helpers.arrayElement([faker.random.word(), undefined]),
    editor: faker.helpers.arrayElement([
      {
        id: faker.helpers.arrayElement([faker.datatype.number({ min: undefined, max: undefined }), undefined]),
        email: faker.helpers.arrayElement([faker.internet.email(), undefined]),
        name: faker.helpers.arrayElement([faker.random.word(), undefined]),
        createdAt: faker.helpers.arrayElement([faker.random.word(), undefined]),
        permissions: faker.helpers.arrayElement([
          Array.from({ length: faker.datatype.number({ min: 1, max: 10 }) }, (_, i) => i + 1).map(() =>
            faker.random.word()
          ),
          undefined,
        ]),
      },
      undefined,
    ]),
  },
  media: {
    id: faker.datatype.number({ min: undefined, max: undefined }),
    assets: Array.from({ length: faker.datatype.number({ min: 1, max: 10 }) }, (_, i) => i + 1).map(() => ({
      id: faker.datatype.number({ min: undefined, max: undefined }),
      type: faker.random.word(),
      url: faker.random.word(),
      metadata: faker.helpers.arrayElement([{}, undefined]),
    })),
  },
  viewCount: faker.datatype.number({ min: undefined, max: undefined }),
  jukeboxable: faker.datatype.boolean(),
  published: faker.datatype.boolean(),
})

export const getGetVideosMock = () => ({
  rows: faker.helpers.arrayElement([
    Array.from({ length: faker.datatype.number({ min: 1, max: 10 }) }, (_, i) => i + 1).map(() => ({})),
    undefined,
  ]),
  offset: faker.helpers.arrayElement([faker.datatype.number({ min: undefined, max: undefined }), undefined]),
  limit: faker.helpers.arrayElement([faker.datatype.number({ min: undefined, max: undefined }), undefined]),
  count: faker.helpers.arrayElement([faker.datatype.number({ min: undefined, max: undefined }), undefined]),
})

export const getGetVideosIdMock = () => ({
  id: faker.datatype.number({ min: undefined, max: undefined }),
  title: faker.random.word(),
  description: faker.random.word(),
  duration: faker.datatype.number({ min: undefined, max: undefined }),
  categories: Array.from({ length: faker.datatype.number({ min: 1, max: 10 }) }, (_, i) => i + 1).map(() =>
    faker.datatype.number({ min: undefined, max: undefined })
  ),
  createdAt: `${faker.date.past().toISOString().split(".")[0]}Z`,
  updatedAt: `${faker.date.past().toISOString().split(".")[0]}Z`,
  organization: {
    id: faker.datatype.number({ min: undefined, max: undefined }),
    name: faker.random.word(),
    description: faker.helpers.arrayElement([faker.random.word(), undefined]),
    homepage: faker.helpers.arrayElement([faker.internet.url(), undefined]),
    postalAddress: faker.helpers.arrayElement([faker.random.word(), undefined]),
    streetAddress: faker.helpers.arrayElement([faker.random.word(), undefined]),
    editor: faker.helpers.arrayElement([
      {
        id: faker.helpers.arrayElement([faker.datatype.number({ min: undefined, max: undefined }), undefined]),
        email: faker.helpers.arrayElement([faker.internet.email(), undefined]),
        name: faker.helpers.arrayElement([faker.random.word(), undefined]),
        createdAt: faker.helpers.arrayElement([faker.random.word(), undefined]),
        permissions: faker.helpers.arrayElement([
          Array.from({ length: faker.datatype.number({ min: 1, max: 10 }) }, (_, i) => i + 1).map(() =>
            faker.random.word()
          ),
          undefined,
        ]),
      },
      undefined,
    ]),
  },
  media: {
    id: faker.datatype.number({ min: undefined, max: undefined }),
    assets: Array.from({ length: faker.datatype.number({ min: 1, max: 10 }) }, (_, i) => i + 1).map(() => ({
      id: faker.datatype.number({ min: undefined, max: undefined }),
      type: faker.random.word(),
      url: faker.random.word(),
      metadata: faker.helpers.arrayElement([{}, undefined]),
    })),
  },
  viewCount: faker.datatype.number({ min: undefined, max: undefined }),
  jukeboxable: faker.datatype.boolean(),
  published: faker.datatype.boolean(),
})

export const getVideoMSW = () => [
  rest.post("*/organizations/:orgId/videos", (_req, res, ctx) => {
    return res(ctx.delay(1000), ctx.status(200, "Mocked status"), ctx.json(getNewVideoMock()))
  }),
  rest.get("*/videos", (_req, res, ctx) => {
    return res(ctx.delay(1000), ctx.status(200, "Mocked status"), ctx.json(getGetVideosMock()))
  }),
  rest.get("*/videos/:id", (_req, res, ctx) => {
    return res(ctx.delay(1000), ctx.status(200, "Mocked status"), ctx.json(getGetVideosIdMock()))
  }),
]
