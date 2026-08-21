"use client";

import { Button } from "@heroui/react";
import { Tab, Tabs } from "@heroui/tabs";
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
    <div className="p-4 rounded-lg h-max">
      {/*
        Five controls in one flat wrapping row rather than arrows around a
        middle group, because the group could not shrink to fit a phone.

        The tab strip is ~265px of unbreakable text. On a 375px screen this bar
        has 295px to work with, and two arrows plus their gaps eat 80 of it, so
        the strip never fits on the same line as both arrows - it used to push
        the forward arrow off the right edge and scroll the whole document
        sideways. Flat items can wrap where a nested group cannot, so below md
        this becomes three lines: the arrows flanking the date they move, the
        phase tabs across the full width, then the date picker. `basis-full` on
        the tabs states that split rather than leaving it to the incidental
        width of a Norwegian long-form date.

        From md up `flex-nowrap` puts it back on one line, and the auto margins
        around the middle three keep them together in the centre with an arrow
        pinned to each end - what `justify-between` did for the old grouping.

        The arrows are `isIconOnly`: a plain HeroUI button reserves min-w-16 for
        a text label, which is more than two arrows can afford here, and its
        centred padding was what left the icon hanging outside the crushed
        button. (The `min-w-none` that used to be here was not a real utility
        and never applied.)
      */}
      <div className="flex flex-wrap items-center justify-center gap-4 md:flex-nowrap">
        <Button
          size={"sm"}
          variant={"bordered"}
          isIconOnly
          className={"order-1 shrink-0"}
          onPress={backward}
          aria-label={"tidligere"}
        >
          <GoArrowLeft title={"tidligere"} />
        </Button>

        <div className={"order-2 md:order-3 text-sm text-center"}>
          {format(parsedDate, "PPPP", { locale: nb })}
        </div>

        <Button
          size={"sm"}
          variant={"bordered"}
          isIconOnly
          className={"order-3 md:order-5 shrink-0"}
          onPress={forward}
          aria-label={"senere"}
        >
          <GoArrowRight title={"senere"} />
        </Button>

        <Tabs
          aria-label={"døgnfase"}
          selectedKey={phase.toString()}
          onSelectionChange={(e) => setPhase(parseInt(e.toString()) as Phase)}
          variant={"light"}
          classNames={{
            // min-w-0 + max-w-full let the strip be narrower than its own tabs
            // on very small phones, where HeroUI's own overflow-x on the list
            // turns it into a scroller instead of letting it bleed out of the
            // card. Above ~300px the tabs fit and neither class does anything.
            base: "order-4 basis-full min-w-0 flex justify-center md:order-2 md:basis-auto md:ml-auto",
            tabList: "max-w-full",
          }}
        >
          <Tab key={"0"} title={"Morgen"} />
          <Tab key={"1"} title={"Dag"} />
          <Tab key={"2"} title={"Kveld"} />
          <Tab key={"3"} title={"Natt"} />
        </Tabs>

        <ScheduleDateSelector
          className={"order-5 shrink-0 md:order-4 md:mr-auto"}
          selected={parsedDate}
          onSelect={(selected) => {
            if (!selected) return;
            router.push(`/schedule/${format(selected, "yyyy/MM/dd")}#p2`);
          }}
        />
      </div>
      {/*eller*/}
    </div>
  );
};
