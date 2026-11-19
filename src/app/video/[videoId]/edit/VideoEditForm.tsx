"use client";
import { FormInput } from "@/components/FormField";
import { ReactNode, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import {
  Category,
  LiveSource,
  PatchedVideoRequest,
  Series,
  Video,
} from "@/generated/frikanalenDjangoAPI.schemas";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Form, Label, ListBox, Select } from "@heroui/react";

import { MDXEditorField } from "@/app/video/[videoId]/edit/MDXEditorField";
import { editAction } from "@/app/video/[videoId]/edit/editAction";
import { videosPartialUpdate } from "@/generated/videos/videos";
import { useApiFormSubmit } from "@/lib/useApiFormSubmit";
import { FormError } from "@/components/form/FormError";
import { SeriesFields } from "@/app/organization/[organizationId]/create/SeriesFields";
import type { SeriesOption } from "@/app/organization/[organizationId]/create/SeriesFields";
import { NewSeriesModal } from "@/app/organization/[organizationId]/create/NewSeriesModal";
import { Categories } from "@/app/organization/[organizationId]/create/Categories";
import { useUnsavedChangesWarning } from "@/lib/useUnsavedChangesWarning";
import {
  LanguageField,
  MinimumAgeField,
} from "@/app/video/[videoId]/edit/ProgrammeInformationFields";

const UNSAVED_WARNING = "Du har endringer som ikke er lagret. Vil du forlate siden?";

export const VideoEditForm = ({
  video,
  series,
  categories = [],
  liveSources = [],
  image,
}: {
  video: Video;
  /** The video's picture, which opens its image manager. */
  image?: ReactNode;
  series: Series[];
  /** Every category there is; the video carries some of them. */
  categories?: Category[];
  /** The organization's live sources; the enabled ones can be chosen. */
  liveSources?: LiveSource[];
}) => {
  const form = useForm<PatchedVideoRequest>({
    defaultValues: {
      name: video.name,
      description: video.description,
      categories: video.categories,
      seriesId: video.series?.id ?? null,
      episodeNumber: video.episodeNumber ?? null,
      liveSource: video.liveSource ?? null,
      spokenLanguage: video.spokenLanguage ?? "",
      minimumAge: video.minimumAge ?? null,
      publishOnWeb: video.publishOnWeb ?? true,
    },
  });
  const { control } = form;
  const router = useRouter();
  const [availableSeries, setAvailableSeries] = useState<SeriesOption[]>(series);
  const [isSeriesModalOpen, setSeriesModalOpen] = useState(false);
  const videoPage = `/video/${video.id}`;

  const { onSubmit, error, isSubmitting } = useApiFormSubmit(form, async (data) => {
    // Sent only when changed: the API checks a source it's given, and a
    // source switched off since would otherwise block every other edit.
    const payload = { ...data };
    if (!form.formState.dirtyFields.liveSource) delete payload.liveSource;
    const update = await videosPartialUpdate(video.id, payload);
    if (update.status !== 200)
      throw new Error(`Failed to update video ${video.id} with status ${update.status}`);
    // Saved: leaving now must not ask about unsaved changes.
    form.reset(data);
    await editAction(video.id);
    router.push(videoPage);
  });

  const isDirty = form.formState.isDirty && !form.formState.isSubmitSuccessful;
  useUnsavedChangesWarning(isDirty, UNSAVED_WARNING);

  const selectSeries = (selected: SeriesOption | null) => {
    const originalSeriesId = video.series?.id ?? null;
    const selectedSeriesId = selected?.id ?? null;
    // Back in its own series it gets its number back; in another one the
    // number starts empty, since many series aren't numbered at all.
    form.setValue(
      "episodeNumber",
      selectedSeriesId === originalSeriesId ? (video.episodeNumber ?? null) : null,
      { shouldDirty: true },
    );
  };

  const seriesCreated = (created: SeriesOption) => {
    setAvailableSeries((current) => [...current, created]);
    form.setValue("seriesId", created.id, { shouldDirty: true });
    form.setValue("episodeNumber", 1, { shouldDirty: true });
  };

  const seriesId = useWatch({ control, name: "seriesId" });
  const selectedSeries = availableSeries.find(({ id }) => id === seriesId);
  const choosableLiveSources = liveSources.filter(
    ({ enabled, id }) => enabled || id === video.liveSource,
  );

  return (
    <div>
      <Form onSubmit={onSubmit} className="flex flex-col gap-5">
        <div className="flex w-full flex-col gap-5 sm:flex-row sm:items-start">
          {image}
          <div className="min-w-0 flex-1 space-y-4">
            <Controller
              control={control}
              name="publishOnWeb"
              render={({ field }) => (
                <VisibilitySwitch value={field.value ?? true} onChange={field.onChange} />
              )}
            />
          </div>
        </div>
        <FormError error={error} />
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <FormInput
              {...field}
              value={field.value ?? ""}
              label={"Navn"}
              id="video-name"
              maxLength={255}
              isRequired
            />
          )}
        />
        <MDXEditorField
          className={"w-full"}
          label={"Beskrivelse"}
          control={control}
          name={"description"}
        />
        {categories.length > 0 && (
          <Categories control={control} name={"categories"} categories={categories} />
        )}
        <SeriesFields
          control={control}
          series={availableSeries}
          seriesName="seriesId"
          onCreateSeries={() => setSeriesModalOpen(true)}
          onSeriesChange={(selected) => selectSeries(selected)}
        />
        {seriesId != null && (
          <Controller
            control={control}
            name="episodeNumber"
            render={({ field }) => (
              <FormInput
                name={field.name}
                ref={field.ref}
                onBlur={field.onBlur}
                type="number"
                inputMode="numeric"
                min={1}
                className="sm:max-w-48"
                label="Episodenummer (valgfritt)"
                description={
                  selectedSeries
                    ? `${selectedSeries.name} har ${selectedSeries.episodeCount} episoder. La stå tomt hvis serien ikke er nummerert.`
                    : "La stå tomt hvis serien ikke er nummerert."
                }
                value={field.value == null ? "" : String(field.value)}
                onValueChange={(value) => field.onChange(value === "" ? null : Number(value))}
              />
            )}
          />
        )}
        {choosableLiveSources.length > 0 || video.liveSource != null ? (
          <div className="space-y-1">
            <Controller
              control={control}
              name="liveSource"
              render={({ field }) => (
                <Select
                  value={field.value == null ? "none" : String(field.value)}
                  onChange={(key) =>
                    field.onChange(key === "none" || key == null ? null : Number(key))
                  }
                  onBlur={field.onBlur}
                >
                  <Label>Direktesending</Label>
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      <ListBox.Item id="none" textValue="Ingen: sendes fra fil">
                        Ingen: sendes fra fil
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                      {choosableLiveSources.map(({ id, name }) => (
                        <ListBox.Item key={id} id={String(id)} textValue={`Direkte fra ${name}`}>
                          Direkte fra {name}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>
              )}
            />
            <p className="text-xs text-foreground-500">
              En direktesending sendes direkte fra kilden helt til videoen har fått en fil.
            </p>
          </div>
        ) : null}
        <div className="grid gap-5 sm:grid-cols-2">
          <LanguageField control={control} name="spokenLanguage" />
          <MinimumAgeField control={control} name="minimumAge" />
        </div>
        <div className="flex w-full flex-wrap items-center justify-end gap-3">
          <Link
            href={videoPage}
            className="text-sm text-foreground-500 underline-offset-4 hover:underline"
          >
            Avbryt
          </Link>
          <Button type={"submit"} isPending={isSubmitting}>
            Lagre
          </Button>
        </div>
      </Form>
      <NewSeriesModal
        organizationId={video.organization.id}
        isOpen={isSeriesModalOpen}
        onOpenChange={setSeriesModalOpen}
        onCreated={seriesCreated}
      />
    </div>
  );
};

const VISIBILITY = [
  {
    value: true,
    label: "Offentlig",
    help: "Vises i arkivet, i søk og på forsiden, og kan sendes på TV.",
  },
  {
    value: false,
    label: "Skjult",
    help: "Vises ikke i arkivet, i søk eller på forsiden, men kan fortsatt sendes på TV.",
  },
];

/** Whether the video is published on the web (`publishOnWeb`). */
const VisibilitySwitch = ({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (_value: boolean) => void;
}) => (
  <fieldset className="space-y-2">
    <legend className="mb-2 text-sm font-medium">Synlighet på nettsiden</legend>
    <div className="inline-flex rounded-md border border-default p-0.5">
      {VISIBILITY.map((option) => (
        <label
          key={option.label}
          className={`cursor-pointer rounded px-4 py-1.5 text-sm font-medium has-focus-visible:outline-2 has-focus-visible:outline-focus ${
            value === option.value
              ? option.value
                ? "bg-primary text-primary-foreground"
                : "bg-foreground text-background"
              : "text-foreground-500 hover:text-foreground"
          }`}
        >
          <input
            type="radio"
            name="visibility"
            className="sr-only"
            checked={value === option.value}
            onChange={() => onChange(option.value)}
          />
          {option.label}
        </label>
      ))}
    </div>
    <p className="text-xs text-foreground-500">
      {VISIBILITY.find((option) => option.value === value)?.help}
    </p>
  </fieldset>
);
