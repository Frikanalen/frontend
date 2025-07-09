"use client";

import { DayPicker } from "react-day-picker";
import { nb } from "react-day-picker/locale";
import "react-day-picker/style.css";
import "./date-picker.css";
import { useState } from "react";

export default function Schedule() {
  const [selected, setSelected] = useState<Date>();
  return (
    <section className="flex w-full flex-col items-center justify-center gap-4 py-8 md:py-10">
      <DayPicker
        animate
        mode={"single"}
        locale={nb}
        selected={selected}
        onSelect={setSelected}
      />
    </section>
  );
}
