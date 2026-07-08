import { useState, useEffect, useCallback } from "react"

type Theme = "dark" | "light" | "system"

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as Theme) || "system"
    }
    return "system"
  })

  const applyTheme = useCallback((newTheme: Theme) => {
    const root = window.document.documentElement
    root.classList.remove("light", "dark")

    if (newTheme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      root.classList.add(systemTheme)
    } else {
      root.classList.add(newTheme)
    }
  }, [])

  useEffect(() => {
    applyTheme(theme)
  }, [theme, applyTheme])

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = () => {
      if (theme === "system") {
        applyTheme("system")
      }
    }
    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [theme, applyTheme])

  const setTheme = useCallback(
    (newTheme: Theme) => {
      localStorage.setItem("theme", newTheme)
      setThemeState(newTheme)
    },
    []
  )

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === "dark" ? "light" : "dark"
      localStorage.setItem("theme", next)
      return next
    })
  }, [])

  return { theme, setTheme, toggleTheme }
}
