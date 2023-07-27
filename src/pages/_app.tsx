import React from "react"
import { Header } from "src/modules/core/components/Header"
import { Footer } from "src/modules/core/components/Footer"
import { ApolloClient, ApolloProvider } from "@apollo/client"
import { UserProvider } from "src/refactor/UserContext"
import { AppProps } from "next/app"
import { client } from "../modules/apollo/client"
import "../modules/styling/global.css"
import "@fontsource-variable/roboto-flex"
import "@fontsource/roboto-mono"
import "@fontsource/roboto-serif"
import { Hydrate, QueryClient, QueryClientProvider } from "@tanstack/react-query"

type FKAppProps = AppProps & {
  apolloClient?: ApolloClient<object>
}

const CustomApp = ({ Component, pageProps, apolloClient = client }: FKAppProps) => {
  const [queryClient] = React.useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <Hydrate state={pageProps.dehydratedState}>
        <ApolloProvider client={apolloClient}>
          <UserProvider>
            <div className={"max-w-[1500px] min-h-screen flex flex-col mx-auto w-full pt-3 md:px-3 md:pt-5 xl:pt-12"}>
              <Header className={"px-2 md:px-0"} />
              <main style={{ isolation: "isolate" }} className="flex flex-col grow">
                <Component {...pageProps} />
              </main>
              <Footer className={"text-slate-800 my-4"} />
            </div>
          </UserProvider>
        </ApolloProvider>
      </Hydrate>
    </QueryClientProvider>
  )
}
export default CustomApp
