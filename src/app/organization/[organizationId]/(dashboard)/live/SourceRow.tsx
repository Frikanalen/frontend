"use client";
import type { LiveSource } from "@/generated/frikanalenDjangoAPI.schemas";
import { Button } from "@heroui/react";
import cx from "classnames";
import Link from "next/link";
import { useId, useState } from "react";
import { sourceStatus, STATUS_NAMES, type SourceStatus } from "@/lib/live/source";
import { BookingStatus } from "./BookingStatus";
import { EncoderKeys } from "./EncoderKeys";
import { PullAddress } from "./PullAddress";
import { SourceSettings } from "./SourceSettings";
import { useSignal } from "./SignalReport";
import { useNow } from "./useSource";

const STATUS_CLASS: Record<SourceStatus, string> = {
  off: "border-default-400 text-default-600",
  "no-encoder": "border-warning text-warning-700",
  waiting: "border-default-300 text-default-600",
  "on-demand": "border-default-300 text-default-600",
  receiving: "border-brand-green text-brand-green",
};

/**
 * One source in the list: what it is, whether a signal is in, when it next
 * airs, and what to do with it next. Checking the signal and the
 * broadcast monitor are pages of their own; its setup folds out. A source
 * no encoder can send to leads with connecting one instead.
 */
export const SourceRow = ({
  organizationId,
  source,
  maySetUp,
  initiallyOpen = false,
}: {
  organizationId: number;
  source: LiveSource;
  maySetUp: boolean;
  initiallyOpen?: boolean;
}) => {
  const [open, setOpen] = useState(initiallyOpen);
  const setupId = useId();
  const enabled = source.enabled !== false;
  const { signal } = useSignal(source.id, { enabled, open: false });
  const now = useNow(0, 30_000);
  const base = `/organization/${organizationId}/live/${source.id}`;
  // Until the receiver has answered, a source is taken to be waiting.
  const status = sourceStatus(source, signal);

  return (
    <section aria-label={source.name} className="border border-default-200 bg-background">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 p-5">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h2 className="text-xl font-bold">{source.name}</h2>
            <span
              className={cx("border-l-4 px-2 text-sm font-semibold", STATUS_CLASS[status])}
              role="status"
            >
              {STATUS_NAMES[status]}
            </span>
          </div>
          <p className="text-sm break-words text-default-600">
            {source.isPulled
              ? `Frikanalen henter fra ${source.pullTarget}`
              : source.encoderCount === 0
                ? "Ingen koder er koblet til, så kilden kan ikke ta imot signal"
                : source.encoderCount === 1
                  ? "Én koder kan sende hit"
                  : `${source.encoderCount} kodere kan sende hit`}
          </p>
          <p className="text-sm">
            <BookingStatus bookings={source.upcomingTransmissions} now={now} />
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {status === "no-encoder" ? (
            maySetUp && !open ? (
              <Button variant="primary" onPress={() => setOpen(true)}>
                Koble til en koder
              </Button>
            ) : null
          ) : enabled ? (
            <>
              <Link
                className="inline-flex h-10 items-center rounded-md bg-accent px-4 text-sm font-semibold text-accent-foreground hover:opacity-90"
                href={base}
              >
                Sjekk signalet
              </Link>
              <Link
                className="inline-flex h-10 items-center border border-default-300 px-4 text-sm font-semibold hover:bg-content1"
                href={`${base}/monitor`}
              >
                Sendeskjerm
              </Link>
            </>
          ) : null}
          <Button
            aria-controls={setupId}
            aria-expanded={open}
            variant="tertiary"
            onPress={() => setOpen(!open)}
          >
            {open ? "Skjul oppsett" : "Oppsett"}
          </Button>
        </div>
      </div>
      <div className={cx("border-t border-default-200 p-5", open ? "" : "hidden")} id={setupId}>
        <SourceSettings maySetUp={maySetUp} source={source}>
          {source.isPulled ? (
            <PullAddress maySetUp={maySetUp} source={source} />
          ) : (
            <EncoderKeys maySetUp={maySetUp} receiving={status === "receiving"} source={source} />
          )}
        </SourceSettings>
      </div>
    </section>
  );
};
