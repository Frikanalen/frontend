import { test } from "@jest/globals"
import { scheduleReducer, ScheduleStateEntry, ScheduleStateVideo } from "./scheduleReducer"
import { add } from "date-fns"

const testVideo: ScheduleStateVideo = {
  id: "1337",
  title: "Test video",
}

const makeTestScheduleEntry = (
  id: string,
  start: Date,
  duration: number = 1800,
  video: ScheduleStateVideo = testVideo,
  source: ScheduleStateEntry["source"] = "jukebox",
): ScheduleStateEntry => ({
  id,
  when: { start, end: add(start, { seconds: duration }) },
  source,
  video,
})

const makeInitialState = (entries: ScheduleStateEntry[]) => ({ change: null, error: undefined, entries })

test("Adds to empty schedule", () => {
  const payload = makeTestScheduleEntry("zero", new Date())
  const initialState = makeInitialState([])
  const newState = scheduleReducer(initialState, { type: "add", payload })
  expect(newState).toEqual({ ...initialState, entries: [payload] })
})

test("Can remove existing from schedule", () => {
  const initialState = makeInitialState([makeTestScheduleEntry("zero", new Date())])
  const newState = scheduleReducer(initialState, {
    type: "remove",
    payload: {
      id: "zero",
    },
  })

  expect(newState).toEqual({ ...initialState, error: undefined, entries: [] })
})

test("Sets error if attempting to remove nonexistant video", () => {
  const entry = makeTestScheduleEntry("zero", new Date())
  const initialState = makeInitialState([entry])
  const newState = scheduleReducer(initialState, {
    type: "remove",
    payload: {
      id: "zorro",
    },
  })

  expect(newState).toEqual({ ...initialState, error: "Unknown index", entries: [entry] })
})

test("Is always chronological", () => {
  const now = new Date()
  const later = add(now, { hours: 1 })
  const beforeEntry = makeTestScheduleEntry("before", now)
  const afterEntry = makeTestScheduleEntry("after", later)
  const initialState = makeInitialState([beforeEntry])
  const newState = scheduleReducer(initialState, {
    type: "add",
    payload: afterEntry,
  })

  expect(newState).toEqual({ ...initialState, entries: [beforeEntry, afterEntry] })
})

test("Allows proposed scheduling on empty schedule", () => {
  const entry = makeTestScheduleEntry("zero", new Date())
  const initialState = makeInitialState([])
  const newState = scheduleReducer(initialState, {
    type: "propose",
    payload: entry,
  })

  expect(newState).toEqual({ ...initialState, change: { canAdd: true }, error: undefined, entries: [] })
})

test("Does not allow scheduling atop manual schedule entry", () => {
  const now = new Date()
  const existing = makeTestScheduleEntry("zero", now, 1800, testVideo, "member")
  const initialState = makeInitialState([existing])
  const candidate = makeTestScheduleEntry("zero", now)

  const newState = scheduleReducer(initialState, {
    type: "propose",
    payload: candidate,
  })

  expect(newState).toEqual({
    ...initialState,
    change: { canAdd: false },
    entries: [{ ...existing, threatened: undefined }],
  })
})

test("Allows scheduling atop jukebox schedule entry, and marks threatened", () => {
  const now = new Date()
  const existing = makeTestScheduleEntry("zero", now, 1800, testVideo)
  const initialState = makeInitialState([existing])
  const candidate = makeTestScheduleEntry("zero", now)

  const newState = scheduleReducer(initialState, {
    type: "propose",
    payload: candidate,
  })

  expect(newState).toEqual({ ...initialState, change: { canAdd: true }, entries: [{ ...existing, threatened: true }] })
})
