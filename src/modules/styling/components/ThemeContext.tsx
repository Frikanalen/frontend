import { useCookie } from "src/modules/state/hooks/useCookie"
import React from "react"
import { darkTheme, lightTheme } from "../themes"
import { Theme, ThemeProvider } from "@mui/system"

export type ThemeType = "light" | "dark"

// NAMING THINGS IS HARD
export type ThemeContextContext = {
  type: ThemeType
  toggle: () => void
}

export const context = React.createContext<ThemeContextContext>({
  type: "light",
  toggle: () => {},
})

export function ThemeContext(props: React.PropsWithChildren<{}>) {
  const { children } = props
  const [type, setType] = useCookie<ThemeType>("theme", "light")

  return (
    <ThemeProvider<Theme> theme={type === "light" ? lightTheme : darkTheme}>
      <context.Provider value={{ type, toggle: () => setType(type === "light" ? "dark" : "light") }}>
        {children}
      </context.Provider>
    </ThemeProvider>
  )
}
