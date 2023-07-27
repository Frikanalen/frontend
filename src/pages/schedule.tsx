import { Meta } from "src/modules/core/components/Meta"
import React from "react"
import { addDays, endOfDay, format, parse, startOfDay } from "date-fns"
import { locale } from "../modules/i18n/dateFn"
import { useGetSchedule } from "../generated/scheduling/scheduling"
import { useRouter } from "next/router"
import cx from "classnames"

const parseDateQuery = (date: string | string[] | undefined) => {
  if (typeof date !== "string") return undefined
  const parsed = parse(date, "yyyy-MM-dd", new Date())
  if (isNaN(parsed.getTime())) return undefined
  return parsed
}

const useScheduleNavigation = () => {
  const router = useRouter()

  const date = parseDateQuery(router.query?.date) ?? new Date()

  const navigate = async (offset: number) => {
    await router.push({ query: { date: format(addDays(date, offset), "yyyy-MM-dd") } })
  }

  return { date, navigate }
}

const ScheduleNavButton = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => {
  return (
    <div
      className={
        "select-none bg-green-600 text-gray-100 font-bold hover:bg-green-500 hover:text-white w-40 p-1 text-center"
      }
    >
      <button onClick={onClick}>{children}</button>
    </div>
  )
}

export const Schedule = () => {
  const { date, navigate } = useScheduleNavigation()

  const { data } = useGetSchedule({ from: startOfDay(date), to: endOfDay(date) })

  return (
    <>
      <Meta
        meta={{
          title: "Sendeplan",
          description: "Timeplan for sending",
        }}
      />

      <div className={"flex w-full justify-between mb-2"}>
        <ScheduleNavButton onClick={() => navigate(-1)}>dagen før</ScheduleNavButton>
        <ScheduleNavButton onClick={() => navigate(1)}>dagen etter</ScheduleNavButton>
      </div>

      <div className={"flex flex-row grow h-[1px] items-stretch"}>
        <div
          className={cx(
            "bg-gradient-to-b from-green-600 to-green-700",
            "text-gray-50 font-bold text-xl w-40 p-4 shrink-0 text-right min-h-fill",
          )}
        >
          {format(date, "PPP", { locale })}
        </div>
        <div className={"flex-auto  bg-green-800 text-gray-50 overflow-auto"}>
          {data?.map(({ startsAt, endsAt, video: { title, description, organization } }, index) => (
            <div key={index} className={""}>
              <div className={"bg-green-900"}>
                <div className={"w-16 text-right font-bold inline-block pr-2"}>
                  {format(new Date(startsAt), "HH:mm")}
                </div>
                <span className={"pr-2"}>&ndash;</span>
                {format(new Date(endsAt), "HH:mm")}
                <span className={"px-2"}>{organization.name}</span>
              </div>

              <div className={"p-2 pl-16 text-gray-50 bg-green-800 truncate"}>
                <span className={"font-bold"}>{title}</span>
                {description && <> &ndash; {description}</>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default Schedule
