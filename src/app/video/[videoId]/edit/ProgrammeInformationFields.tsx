"use client";
import { useState } from "react";
import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { Label, ListBox, Select } from "@heroui/react";
import { FormInput } from "@/components/FormField";

/**
 * Both fields go out in the TV-Anytime EPG feed, so they say what a
 * distributor's guide will say about the programme.
 */

const LANGUAGES = [
  { tag: "no", name: "Norsk" },
  { tag: "nn", name: "Norsk (nynorsk)" },
  { tag: "se", name: "Nordsamisk" },
  { tag: "smj", name: "Lulesamisk" },
  { tag: "sma", name: "Sørsamisk" },
  { tag: "fkv", name: "Kvensk" },
  { tag: "en", name: "Engelsk" },
  { tag: "", name: "Ingen tale" },
];
const OTHER = "other";
const NO_SPEECH = "none";

const keyFor = (tag: string) => (tag === "" ? NO_SPEECH : tag);

export const LanguageField = <T extends FieldValues>({
  control,
  name,
}: {
  control: Control<T>;
  name: Path<T>;
}) => (
  <Controller
    control={control}
    name={name}
    render={({ field }) => <LanguageSelect value={field.value ?? ""} onChange={field.onChange} />}
  />
);

const LanguageSelect = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (_tag: string) => void;
}) => {
  // A language not in the short list (the field takes any language tag)
  // opens the free-text box, and so does choosing "Annet språk".
  const [isOther, setOther] = useState(() => !LANGUAGES.some(({ tag }) => tag === value));

  return (
    <div className="space-y-2">
      <Select
        value={isOther ? OTHER : keyFor(value)}
        onChange={(key) => {
          if (key === OTHER) {
            setOther(true);
            return;
          }
          setOther(false);
          onChange(key === NO_SPEECH || key == null ? "" : String(key));
        }}
      >
        <Label>Språk</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {LANGUAGES.map(({ tag, name }) => (
              <ListBox.Item key={keyFor(tag)} id={keyFor(tag)} textValue={name}>
                {name}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
            <ListBox.Item id={OTHER} textValue="Annet språk">
              Annet språk
              <ListBox.ItemIndicator />
            </ListBox.Item>
          </ListBox>
        </Select.Popover>
      </Select>
      {isOther && (
        <FormInput
          label="Språkkode"
          description="For eksempel «ar» (arabisk), «so» (somali) eller «pl» (polsk)."
          maxLength={32}
          value={value}
          onValueChange={onChange}
        />
      )}
    </div>
  );
};

const AGE_RATINGS = [
  { key: "unrated", value: null, name: "Ikke vurdert" },
  { key: "0", value: 0, name: "Tillatt for alle" },
  { key: "6", value: 6, name: "6 år" },
  { key: "9", value: 9, name: "9 år" },
  { key: "12", value: 12, name: "12 år" },
  { key: "15", value: 15, name: "15 år" },
  { key: "18", value: 18, name: "18 år" },
];

export const MinimumAgeField = <T extends FieldValues>({
  control,
  name,
}: {
  control: Control<T>;
  name: Path<T>;
}) => (
  <Controller
    control={control}
    name={name}
    render={({ field }) => (
      <div className="space-y-1">
        <Select
          value={field.value == null ? "unrated" : String(field.value)}
          onChange={(key) =>
            field.onChange(AGE_RATINGS.find((rating) => rating.key === key)?.value ?? null)
          }
          onBlur={field.onBlur}
        >
          <Label>Aldersgrense</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {AGE_RATINGS.map(({ key, name }) => (
                <ListBox.Item key={key} id={key} textValue={name}>
                  {name}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
        <p className="text-xs text-foreground-500">
          Medietilsynets aldersgrenser. «Ikke vurdert» oppgir ingen aldersgrense.
        </p>
      </div>
    )}
  />
);
