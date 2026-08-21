import { Series } from "@/generated/frikanalenDjangoAPI.schemas";
import { Input, Select, SelectItem } from "@heroui/react";
import {
  Control,
  Controller,
  FieldValues,
  Path,
  PathValue,
  UseFormRegister,
} from "react-hook-form";

export const SeriesFields = <T extends FieldValues>({
  control,
  register,
  series,
  seriesName,
  episodeName,
  selectedSeries,
}: {
  control: Control<T>;
  register: UseFormRegister<T>;
  series: Series[];
  seriesName: Path<T>;
  episodeName: Path<T>;
  selectedSeries: number | null | undefined;
}) => (
  <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
    <Controller
      control={control}
      name={seriesName}
      render={({ field }) => (
        <Select
          label="Serie"
          labelPlacement="outside-top"
          selectedKeys={new Set([field.value ? String(field.value) : "none"])}
          onSelectionChange={(keys) => {
            const key = Array.from(keys)[0];
            field.onChange(key === "none" ? null : Number(key));
          }}
          onBlur={field.onBlur}
          items={[
            { id: "none", name: "Ingen serie" },
            ...series.map((item) => ({ id: item.id.toString(), name: item.name })),
          ]}
        >
          {(item) => <SelectItem key={item.id}>{item.name}</SelectItem>}
        </Select>
      )}
    />
    <Input
      type="number"
      min={1}
      label="Episodenummer"
      labelPlacement="outside-top"
      isDisabled={!selectedSeries}
      {...register(episodeName, {
        disabled: !selectedSeries,
        setValueAs: (value) => (value === "" ? null : Number(value)) as PathValue<T, Path<T>>,
      })}
    />
  </div>
);
