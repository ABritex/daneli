"use client";

import { useEffect, useState } from "react";
import { TIMEZONE } from "../config";

// just keeps a ticking local time string so the footer feels alive
export function useLocalTime() {
    const [time, setTime] = useState("");
    const [year, setYear] = useState("2026");

    useEffect(() => {
        const fmt = new Intl.DateTimeFormat("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: TIMEZONE,
        });

        const tick = () => setTime(fmt.format(new Date()));
        tick();
        // eslint-disable-next-line react-hooks/set-state-in-effect -- grabbing year on client so prerender doesnt freak out
        setYear(String(new Date().getFullYear()));

        const id = window.setInterval(tick, 15000);
        return () => window.clearInterval(id);
    }, []);

    return { time, year };
}
