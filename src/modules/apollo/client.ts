import { ApolloClient, InMemoryCache } from "@apollo/client"

export const client = new ApolloClient({
  uri: process.env.NEXT_PUBLIC_FK_GRAPHQL,
  cache: new InMemoryCache(),
  credentials: "include",
})
