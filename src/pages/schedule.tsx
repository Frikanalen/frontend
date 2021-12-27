import styled from "@emotion/styled"
import { observer } from "mobx-react-lite"
import { Meta } from "src/modules/core/components/Meta"
import { CalendarInput } from "src/modules/input/components/CalendarInput"
import { ScheduleTimelineItem } from "src/modules/schedule/components/ScheduleTimelineItem"
import { humanizeSelectedScheduleDate } from "src/modules/schedule/helpers/humanizeSelectedScheduleDate"
import { useStores } from "src/modules/state/manager"
import { Spinner } from "src/modules/ui/components/Spinner"
import { NextPageContext } from "next"
import React from "react"
import { ScheduleTimeline } from "src/modules/schedule/components/ScheduleTimeline/ScheduleTimeline"

const breakpoint = 700

const Container = styled.div`
  display: flex;

  @media (max-width: ${breakpoint}px) {
    flex-direction: column;
  }
`

const Sidebar = styled.div`
  width: 320px;

  padding-left: 32px;

  @media (max-width: ${breakpoint}px) {
    border-left: none;
    padding-left: 0px;
    margin-left: 0px;

    width: 100%;
    order: -1;

    margin-bottom: 32px;
  }
`

const Result = styled.div`
  flex: 1;
  max-height: calc(100vh - 325px);
`

const DayTitle = styled.h1`
  margin-bottom: 16px;
`

const SpinnerContainer = styled.div`
  display: flex;

  justify-content: center;
  align-items: center;

  height: calc(100vh - 400px);
`

function Schedule() {
  const { scheduleStore } = useStores()
  const { selectedDate, selectedDateItems } = scheduleStore

  const handleSelect = (date: Date) => {
    scheduleStore.selectedDate = date
    scheduleStore.fetchByDate(date)
  }

  const renderSpinner = () => {
    if (selectedDateItems.status !== "fetching") return null

    return (
      <SpinnerContainer>
        <Spinner size="normal" />
      </SpinnerContainer>
    )
  }

  return (
    <Container>
      <Meta
        meta={{
          title: "Sendeplan",
          description: "Oversikt over programmer som blir sendt i dag",
        }}
      />
      <Result>
        <ScheduleTimeline entries={selectedDateItems.data ?? []} zoom={500} />
      </Result>
      <Sidebar>
        <CalendarInput value={selectedDate} onChange={handleSelect} />
      </Sidebar>
    </Container>
  )
}

Schedule.getInitialProps = async (context: NextPageContext) => {
  const { scheduleStore } = context.manager.stores
  await scheduleStore.fetchByDate(scheduleStore.selectedDate)

  return {}
}

export default observer(Schedule)
