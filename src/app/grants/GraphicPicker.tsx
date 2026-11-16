"use client";
import type { GrantItemGraphic } from "@/generated/frikanalenDjangoAPI.schemas";
import { useGraphicsList } from "@/generated/graphics/graphics";
import { formatApiError } from "@/lib/formatApiError";
import { Button as HeroButton } from "@heroui/react";
import { useState } from "react";
import { GoDeviceDesktop } from "react-icons/go";
import { formatDuration } from "./duration";

const MINUTE = 60_000;

/**
 * Staff put a graphic (an HTML page such as the infographics) in the list
 * for as long as they choose. It airs with filler music and stays off the
 * public schedule. Graphics are added in the Django admin.
 */
export const GraphicPicker = ({
  remaining,
  onPick,
}: {
  /** Time left at the end of the list. */
  remaining: number;
  onPick: (_graphic: GrantItemGraphic, _milliseconds: number) => void;
}) => {
  const graphics = useGraphicsList();
  const results = graphics.data?.data ?? [];
  const room = Math.floor(remaining / MINUTE);
  // Empty means "the rest of the window".
  const [minutes, setMinutes] = useState("");
  const chosen = minutes === "" ? room : Number(minutes);
  const valid = Number.isInteger(chosen) && chosen >= 1 && chosen <= room;

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold">Grafikk</h2>
      <p className="text-sm text-default-600">
        Bare for stab. Sendes med pausemusikk og vises ikke i sendeplanen.
      </p>
      <label className="flex flex-wrap items-center gap-2">
        Lengde i minutter
        <input
          className="w-24 rounded-lg border border-default-300 bg-background px-3 py-2"
          inputMode="numeric"
          min={1}
          max={room}
          placeholder={String(room)}
          type="number"
          value={minutes}
          onChange={(event) => setMinutes(event.target.value)}
        />
        <span className="text-sm text-default-600">
          {room >= 1 ? `tomt = resten, ${formatDuration(room * MINUTE)}` : "ikke plass i listen"}
        </span>
      </label>
      {graphics.isError ? <p role="alert">{formatApiError(graphics.error)}</p> : null}
      <ul aria-label="Grafikk du kan legge til" className="border-t border-default-200">
        {results.map((graphic) => (
          <li
            key={graphic.id}
            className="flex items-center gap-2 border-b border-default-200 px-1 py-2.5"
          >
            <GoDeviceDesktop aria-hidden className="shrink-0 text-default-600" />
            <div className="min-w-0 grow">
              <div className="truncate font-semibold">{graphic.name}</div>
              <a
                className="block truncate text-sm text-default-600 underline"
                href={graphic.url}
                rel="noreferrer"
                target="_blank"
              >
                {graphic.url}
              </a>
            </div>
            <HeroButton
              isDisabled={!valid}
              size="sm"
              variant="tertiary"
              onPress={() => onPick(graphic, chosen * MINUTE)}
            >
              Legg til
            </HeroButton>
          </li>
        ))}
        {!graphics.isLoading && results.length === 0 ? (
          <li className="p-2 text-sm text-default-600">Ingen grafikk er satt opp.</li>
        ) : null}
      </ul>
    </section>
  );
};
