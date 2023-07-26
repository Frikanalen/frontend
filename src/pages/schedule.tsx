import { Meta } from "src/modules/core/components/Meta"
import React, { useState } from "react"
import { addDays, endOfDay, format, startOfDay } from "date-fns"
import { locale } from "../modules/i18n/dateFn"
import { useGetSchedule } from "../generated/scheduling/scheduling"
import { Button } from "@mui/material"

export const Schedule = () => {
  const [date, setDate] = useState<Date>(new Date())
  const { data } = useGetSchedule({ from: startOfDay(date), to: endOfDay(date) })
  console.log(data)

  return (
    <div className={"mt-4 min-h-[800px]"}>
      <Meta
        meta={{
          title: "Sendeplan",
          description: "Timeplan for sending",
        }}
      />

      <div className={"flex w-full justify-between p-4"}>
        <Button
          variant={"outlined"}
          onClick={() => {
            setDate((date) => addDays(date, -1))
          }}
        >
          dagen før
        </Button>
        <Button
          variant={"outlined"}
          onClick={() => {
            setDate((date) => addDays(date, 1))
          }}
        >
          dagen etter
        </Button>
      </div>
      <div className={"flex w-full"}>
        <div className={"bg-gradient-to-b from-green-600 to-green-700 text-gray-50 font-bold text-xl p-5 text-right "}>
          {format(date, "PPP", { locale })}
        </div>
        <div className={"grow"}>
          {data?.map((program, index) => (
            <div key={index}>
              <div className={"p-2 flex gap-4 bg-green-900 text-gray-100"}>
                <div className={""}>
                  {format(new Date(program.startsAt), "HH:mm")}
                  &thinsp;&thinsp;&ndash;&thinsp;&thinsp;
                  {format(new Date(program.endsAt), "HH:mm")}
                </div>
                {program.video.organization.name}
              </div>
              <div className={"p-2 bg-gray-200"}>
                <h3 className={""}>{program.video.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Schedule
