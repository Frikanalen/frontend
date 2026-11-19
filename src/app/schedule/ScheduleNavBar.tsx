"use client";

import { Button } from "@heroui/react";
import { addDays, format } from "date-fns";
import { nb } from "date-fns/locale/nb";
import { GoArrowLeft, GoArrowRight } from "react-icons/go";
import { ScheduleDateSelector } from "@/app/schedule/ScheduleDateSelector";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { TZDate } from "@date-fns/tz/date";
import { OSLO_TIME_ZONE } from "@/lib/osloTime";

export const ScheduleNavBar = ({
  year,
  month,
  date,
}: {
  year: string;
  month: string;
  date: string;
}) => {
  const parsedDate = useMemo(
    () => new TZDate(parseInt(year), parseInt(month) - 1, parseInt(date), 0, 0, 0, OSLO_TIME_ZONE),
    [year, month, date],
  );
  const router = useRouter();

  const PREV_URL = `/schedule/${format(addDays(parsedDate, -1), "yyyy/MM/dd")}`;
  const NEXT_URL = `/schedule/${format(addDays(parsedDate, 1), "yyyy/MM/dd")}`;

  useEffect(() => {
    router.prefetch(PREV_URL);
    router.prefetch(NEXT_URL);
  }, [router, NEXT_URL, PREV_URL]);

  return (
    <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
      <div>
        <h1 className="text-5xl leading-none font-extrabold tracking-tighter sm:text-6xl">
          Sendeplan
        </h1>
        <p className="mt-3 text-lg text-default-600 first-letter:uppercase">
          {format(parsedDate, "PPPP", { locale: nb })}
        </p>
      </div>
      {/*
        The arrows are `isIconOnly`: a plain HeroUI button reserves min-w-16
        for a text label, which is more than two arrows can afford here.
      */}
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <Button
          size={"sm"}
          variant={"outline"}
          isIconOnly
          className={"order-1 shrink-0"}
          onPress={() => router.replace(PREV_URL)}
          aria-label={"tidligere"}
        >
          <GoArrowLeft title={"tidligere"} />
        </Button>

        <Button
          size={"sm"}
          variant={"outline"}
          isIconOnly
          className={"order-3 shrink-0"}
          onPress={() => router.replace(NEXT_URL)}
          aria-label={"senere"}
        >
          <GoArrowRight title={"senere"} />
        </Button>

        <ScheduleDateSelector
          className={"order-2 shrink-0"}
          selected={parsedDate}
          onSelect={(selected) => {
            if (!selected) return;
            router.push(`/schedule/${format(selected, "yyyy/MM/dd")}`);
          }}
        />
      </div>
    </div>
  );
};
