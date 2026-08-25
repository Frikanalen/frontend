import { Series } from "@/generated/frikanalenDjangoAPI.schemas";
import { Button, Select, SelectItem } from "@heroui/react";
import { Control, Controller, FieldValues, Path } from "react-hook-form";

export type SeriesOption = Pick<Series, "id" | "name" | "episodeCount">;

export const nextEpisodeNumber = (series: SeriesOption | null) =>
  series ? series.episodeCount + 1 : null;

export const SeriesFields = <T extends FieldValues>({
  control,
  series,
  seriesName,
  onCreateSeries,
  onSeriesChange,
}: {
  control: Control<T>;
  series: SeriesOption[];
  seriesName: Path<T>;
  onCreateSeries?: () => void;
  onSeriesChange?: (_series: SeriesOption | null) => void;
}) => {
  const seriesSelect = (
    <Controller
      control={control}
      name={seriesName}
      render={({ field }) => (
        <Select
          label="Serie (valgfritt)"
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

  return (
    <div className="space-y-1">
      <div className={onCreateSeries ? "grid items-end gap-4 sm:grid-cols-[2fr_1fr]" : undefined}>
        {seriesSelect}
        {onCreateSeries && (
          <Button type="button" variant="flat" className="w-full sm:w-fit" onPress={onCreateSeries}>
            Opprett ny serie
          </Button>
        )}
      </div>
      <p className="text-xs text-foreground-500">
        La stå som «Ingen serie» for en enkeltstående video.
      </p>
    </div>
  );
};
