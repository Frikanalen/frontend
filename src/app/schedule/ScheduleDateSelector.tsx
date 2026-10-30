"use client";
import { DayPicker, PropsSingle } from "react-day-picker";
import { Button, Popover } from "@heroui/react";
import { nb } from "react-day-picker/locale";
import "react-day-picker/style.css";
import "./date-picker.css";
export const ScheduleDateSelector = ({
  selected,
  onSelect,
  className,
}: {
  selected: PropsSingle["selected"];
  onSelect: PropsSingle["onSelect"];
  // The button is the popover trigger and owns the surrounding flex-row position.
  className?: string;
}) => (
  <Popover>
    <Button size={"sm"} variant={"outline"} className={`rounded-md ${className ?? ""}`}>
      Velg dato
    </Button>
    <Popover.Content placement={"left"}>
      <Popover.Dialog>
        <DayPicker
          animate
          className={"p-4"}
          mode={"single"}
          locale={nb}
          selected={selected}
          onSelect={onSelect}
        />
      </Popover.Dialog>
    </Popover.Content>
  </Popover>
);
