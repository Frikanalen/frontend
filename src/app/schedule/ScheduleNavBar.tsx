"use client";

import { Button } from "@heroui/react";
import { Tabs } from "@heroui/react";
import { addDays, format } from "date-fns";
import { nb } from "date-fns/locale/nb";
import { GoArrowLeft, GoArrowRight } from "react-icons/go";
import { ScheduleDateSelector } from "@/app/schedule/ScheduleDateSelector";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { TZDate } from "@date-fns/tz/date";
import { OSLO_TIME_ZONE } from "@/lib/osloTime";
import { Phase, useDatePhaseInHash } from "@/app/schedule/useDatePhaseInHash";

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

  const [phase, setPhase] = useDatePhaseInHash();
  const PREV_URL = `/schedule/${format(addDays(parsedDate, -1), "yyyy/MM/dd")}#p3`;
  const NEXT_URL = `/schedule/${format(addDays(parsedDate, 1), "yyyy/MM/dd")}#p0`;

  useEffect(() => {
    router.prefetch(PREV_URL);
    router.prefetch(NEXT_URL);
  }, [router, NEXT_URL, PREV_URL]);

  const forward = () =>
    phase === 3 ? router.replace(NEXT_URL) : setPhase((phase + 1) as Exclude<Phase, 0>);

  const backward = () =>
    phase === 0 ? router.replace(PREV_URL) : setPhase((phase - 1) as Exclude<Phase, 3>);

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
        The controls wrap as flat items rather than as arrows around a middle
        group, because a nested group could not shrink to fit a phone: the tab
        strip alone is ~265px of unbreakable text. Below md the tabs take a
        line of their own (`basis-full`), with the arrows and the date picker
        on the line above.

        The arrows are `isIconOnly`: a plain HeroUI button reserves min-w-16
        for a text label, which is more than two arrows can afford here.
      */}
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <Button
          size={"sm"}
          variant={"outline"}
          isIconOnly
          className={"order-2 shrink-0"}
          onPress={backward}
          aria-label={"tidligere"}
        >
          <GoArrowLeft title={"tidligere"} />
        </Button>

        <Button
          size={"sm"}
          variant={"outline"}
          isIconOnly
          className={"order-4 shrink-0"}
          onPress={forward}
          aria-label={"senere"}
        >
          <GoArrowRight title={"senere"} />
        </Button>

        <Tabs
          aria-label={"døgnfase"}
          selectedKey={phase.toString()}
          onSelectionChange={(e) => setPhase(parseInt(e.toString()) as Phase)}
          variant={"primary"}
          className={
            // min-w-0 + max-w-full let the strip be narrower than its own tabs
            // on very small phones, where HeroUI's own overflow-x on the list
            // turns it into a scroller instead of letting it bleed out of the
            // card. Above ~300px the tabs fit and neither class does anything.
            "order-5 flex min-w-0 basis-full md:order-1 md:mr-4 md:basis-auto"
          }
        >
          <Tabs.ListContainer className="max-w-full">
            <Tabs.List aria-label="Døgnfase">
              {["Morgen", "Dag", "Kveld", "Natt"].map((title, index) => (
                <Tabs.Tab
                  key={index}
                  id={String(index)}
                  className="px-3 text-default-600 data-[selected=true]:text-foreground"
                >
                  {title}
                  <Tabs.Indicator />
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs.ListContainer>
        </Tabs>

        <ScheduleDateSelector
          className={"order-3 shrink-0"}
          selected={parsedDate}
          onSelect={(selected) => {
            if (!selected) return;
            router.push(`/schedule/${format(selected, "yyyy/MM/dd")}#p2`);
          }}
        />
      </div>
    </div>
  );
};
