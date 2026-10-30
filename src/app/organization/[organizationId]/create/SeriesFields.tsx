import { Series } from "@/generated/frikanalenDjangoAPI.schemas";
import { Button, Label, ListBox, Select } from "@heroui/react";
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
          value={field.value ? String(field.value) : "none"}
          onChange={(key) => {
            const selected =
              key === "none" || key == null
                ? null
                : (series.find(({ id }) => id === Number(key)) ?? null);
            field.onChange(selected?.id ?? null);
            onSeriesChange?.(selected);
          }}
          onBlur={field.onBlur}
        >
          <Label>Serie (valgfritt)</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              <ListBox.Item id="none" textValue="Ingen serie">
                Ingen serie
                <ListBox.ItemIndicator />
              </ListBox.Item>
              {series.map((item) => (
                <ListBox.Item key={item.id} id={String(item.id)} textValue={item.name}>
                  {item.name}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      )}
    />
  );

  return (
    <div className="space-y-1">
      <div className={onCreateSeries ? "grid items-end gap-4 sm:grid-cols-[2fr_1fr]" : undefined}>
        {seriesSelect}
        {onCreateSeries && (
          <Button
            type="button"
            variant="tertiary"
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
};
