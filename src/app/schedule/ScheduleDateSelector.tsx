"use client";
import { DayPicker, PropsSingle } from "react-day-picker";
import { Button, Popover, PopoverContent, PopoverTrigger } from "@heroui/react";
import { nb } from "react-day-picker/locale";
import "react-day-picker/style.css";
import "./date-picker.css";
export const ScheduleDateSelector = ({
  selected,
  onSelect,
}: {
  selected: PropsSingle["selected"];
  onSelect: PropsSingle["onSelect"];
}) => (
  <Popover placement={"left-start"}>
    <PopoverTrigger>
      <Button size={"sm"} variant={"bordered"} className={"min-w-none"}>
        Velg dato
      </Button>
    </PopoverTrigger>
    <PopoverContent>
      <DayPicker
        animate
        className={"p-4"}
        mode={"single"}
        locale={nb}
        selected={selected}
        onSelect={onSelect}
      />
    </PopoverContent>
  </Popover>
);
