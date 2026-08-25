import { Series } from "@/generated/frikanalenDjangoAPI.schemas";
import { Button, Input, Select, SelectItem } from "@heroui/react";
import {
  Control,
  Controller,
  FieldValues,
  Path,
  PathValue,
  UseFormRegister,
} from "react-hook-form";

export type SeriesOption = Pick<Series, "id" | "name" | "episodeCount">;

export const nextEpisodeNumber = (series: SeriesOption | null) =>
  series ? series.episodeCount + 1 : null;

export const SeriesFields = <T extends FieldValues>({
  control,
  register,
  series,
  seriesName,
  episodeName,
  selectedSeries,
  onCreateSeries,
  onSeriesChange,
  showEpisodeNumber = true,
}: {
  control: Control<T>;
  register: UseFormRegister<T>;
  series: SeriesOption[];
  seriesName: Path<T>;
  episodeName: Path<T>;
  selectedSeries: number | null | undefined;
  onCreateSeries?: () => void;
  onSeriesChange?: (_series: SeriesOption | null) => void;
  showEpisodeNumber?: boolean;
}) => {
  const seriesSelect = (
    <Controller
      control={control}
      name={seriesName}
      render={({ field }) => (
        <Select
          label="Serie (valgfritt)"
          description={
            showEpisodeNumber ? "La stå som «Ingen serie» for en enkeltstående video." : undefined
          }
          labelPlacement="outside-top"
          selectedKeys={new Set([field.value ? String(field.value) : "none"])}
          onSelectionChange={(keys) => {
            const key = Array.from(keys)[0];
            const selected =
              key === "none" ? null : (series.find(({ id }) => id === Number(key)) ?? null);
            field.onChange(selected?.id ?? null);
            onSeriesChange?.(selected);
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
  );

  if (!showEpisodeNumber) {
    return (
      <div className="space-y-1">
        <div className="grid items-end gap-4 sm:grid-cols-[2fr_1fr]">
          {seriesSelect}
          {onCreateSeries && (
            <Button
              type="button"
              variant="flat"
              className="w-full sm:w-fit"
              onPress={onCreateSeries}
            >
              Opprett ny serie
            </Button>
          )}
        </div>
        <p className="text-xs text-foreground-500">
          La stå som «Ingen serie» for en enkeltstående video.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
      {seriesSelect}
      <Input
        type="number"
        min={1}
        label="Episodenummer"
        description={
          selectedSeries ? "Neste nummer foreslås automatisk, men kan endres." : undefined
        }
        labelPlacement="outside-top"
        isDisabled={!selectedSeries}
        {...register(episodeName, {
          disabled: !selectedSeries,
          setValueAs: (value) => (value === "" ? null : Number(value)) as PathValue<T, Path<T>>,
        })}
      />
    </div>
  );
};
