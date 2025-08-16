import * as React from "react";
import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { Select, SelectItem } from "@heroui/react";
import { Category } from "@/generated/frikanalenDjangoAPI.schemas";

export const Categories = <T extends FieldValues>({
  control,
  categories,
  name,
}: {
  control: Control<T>;
  categories: Category[];
  name: Path<T>;
}) => (
  <Controller
    control={control}
    name={name}
    render={({ field }) => (
      <Select
        selectionMode="multiple"
        placeholder="Select categories"
        selectedKeys={new Set(field.value ?? [])}
        onSelectionChange={(keys) => field.onChange(Array.from(keys as Set<React.Key>).map(String))}
        onBlur={field.onBlur}
      >
        {categories.map((c) => (
          <SelectItem key={c.name}>{c.name}</SelectItem>
        ))}
      </Select>
    )}
  />
);
