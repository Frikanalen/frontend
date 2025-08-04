"use client";

import { Button } from "@heroui/react";
import { Tab, Tabs } from "@heroui/tabs";
import { addDays, format } from "date-fns";
import { nb } from "date-fns/locale/nb";
import { GoArrowLeft, GoArrowRight } from "react-icons/go";
import { ScheduleDateSelector } from "@/app/schedule/ScheduleDateSelector";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { TZDate } from "@date-fns/tz/date";
import { ScheduleitemRead } from "@/generated/frikanalenDjangoAPI.schemas";
import { ScheduleItemList } from "@/app/schedule/ScheduleItemView";

export const ScheduleUI = ({
  year,
  month,
  date,
  items,
}: {
  year: string;
  month: string;
  date: string;
  items: ScheduleitemRead[];
}) => (
  <>
    <ScheduleNavBar year={year} month={month} date={date} />
    <ScheduleItemList items={items} />
  </>
);

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
    () =>
      new TZDate(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(date),
        0,
        0,
        0,
        "Europe/Oslo",
      ),
    [year, month, date],
  );
  const router = useRouter();
  const [phase, setPhase] = useState<0 | 1 | 2 | 3>(0);

  const PREV_URL = `/schedule/${format(addDays(parsedDate, -1), "yyyy/MM/dd")}`;
  const NEXT_URL = `/schedule/${format(addDays(parsedDate, 1), "yyyy/MM/dd")}`;

  useEffect(() => {
    router.prefetch(PREV_URL);
    router.prefetch(NEXT_URL);
  }, [router, NEXT_URL, PREV_URL]);

  const forward = () =>
    phase === 3 ? router.replace(NEXT_URL) : setPhase((phase + 1) as 1 | 2 | 3);

  const backward = () =>
    phase === 0 ? router.replace(PREV_URL) : setPhase((phase - 1) as 0 | 1 | 2);

  return (
    <div className="bg-content1 text-content1-foreground p-4 rounded-lg h-max">
      <div className="flex items-center gap-4 justify-between">
        <Button
          size={"sm"}
          variant={"bordered"}
          className={"min-w-none"}
          onPress={backward}
        >
          <GoArrowLeft title={"tidligere"} />
        </Button>
        <div className="flex  max-md:flex-col items-center gap-4">
          <Tabs
            aria-label={"døgnfase"}
            selectedKey={phase.toString()}
            onSelectionChange={(e) =>
              setPhase(parseInt(e.toString()) as 0 | 1 | 2 | 3)
            }
            variant={"light"}
          >
            <Tab key={"0"} title={"Morgen"} />
            <Tab key={"1"} title={"Dag"} />
            <Tab key={"2"} title={"Ettermiddag"} />
            <Tab key={"3"} title={"Kveld"} />
          </Tabs>
          <div className={"text-sm"}>
            {format(parsedDate, "PPPP", { locale: nb })}
          </div>
          <ScheduleDateSelector selected={parsedDate} onSelect={() => {}} />
        </div>

        <Button
          size={"sm"}
          variant={"bordered"}
          className={"min-w-none"}
          onPress={forward}
          aria-label={"senere"}
        >
          <GoArrowRight title={"senere"} />
        </Button>
      </div>
      {/*eller*/}
    </div>
  );
};
