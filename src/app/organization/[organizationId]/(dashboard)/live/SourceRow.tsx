"use client";
import type { LiveSource } from "@/generated/frikanalenDjangoAPI.schemas";
import { Button } from "@heroui/react";
import cx from "classnames";
import Link from "next/link";
import { useId, useState, type ReactNode } from "react";
import { BookingStatus } from "./BookingStatus";
import { useSignal } from "./SignalReport";
import { useNow } from "./useSource";

/**
 * One source in the list: what it is, whether a signal is in, when it next
 * airs, and the two things to do with it. Checking the signal and the
 * broadcast monitor are pages of their own; its keys and settings fold out.
 */
export const SourceRow = ({
  organizationId,
  source,
  children,
}: {
  organizationId: number;
  source: LiveSource;
  /** The source's setup: its encoder keys or pull address. */
  children: ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  const setupId = useId();
  const enabled = source.enabled !== false;
  const { signal } = useSignal(source.id, { enabled, open: false });
  const now = useNow(0, 30_000);
  const base = `/organization/${organizationId}/live/${source.id}`;

  return (
    <section aria-label={source.name} className="border border-default-200 bg-background">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 p-5">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h2 className="text-xl font-bold">{source.name}</h2>
            {!enabled ? (
              <span className="border-l-4 border-danger px-2 text-sm font-semibold text-danger-700">
                Slått av
              </span>
            ) : signal ? (
              <span
                className={cx(
                  "border-l-4 px-2 text-sm font-semibold",
                  signal.receiving
                    ? "border-brand-green text-brand-green"
                    : "border-default-300 text-default-600",
                )}
                role="status"
              >
                {signal.receiving
                  ? "Mottar signal"
                  : source.isPulled
                    ? "Hentes ved behov"
                    : "Ingen signal"}
              </span>
            ) : null}
          </div>
          <p className="text-sm break-words text-default-600">
            {source.isPulled
              ? `Frikanalen henter fra ${source.pullTarget}`
              : "Sendes til Frikanalen fra en koder"}
          </p>
          <p className="text-sm">
            <BookingStatus bookings={source.upcomingTransmissions} now={now} />
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {enabled ? (
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
        {children}
      </div>
    </section>
  );
};
