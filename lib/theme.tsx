"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { getSetting, setSetting } from "./storage";

type Theme = "light" | "dark";

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>("dark");

    useEffect(() => {
        const loadTheme = async () => {
            const savedTheme = await getSetting("theme") as Theme;
            if (savedTheme) {
                setTheme(savedTheme);
                document.documentElement.classList.toggle("light", savedTheme === "light");
            }
        };
        loadTheme();
    }, []);

    const toggleTheme = async () => {
        const newTheme = theme === "dark" ? "light" : "dark";
        setTheme(newTheme);
        await setSetting("theme", newTheme);
        document.documentElement.classList.toggle("light", newTheme === "light");
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
