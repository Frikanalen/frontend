import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { Label, ListBox, Select } from "@heroui/react";
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
        placeholder="Velg minst én kategori"
        isRequired
        value={field.value ?? []}
        onChange={field.onChange}
        onBlur={field.onBlur}
      >
        <Label>Kategorier</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {categories.map((category) => (
              <ListBox.Item key={category.name} id={category.name} textValue={category.name}>
                {category.name}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>
    )}
  />
);
