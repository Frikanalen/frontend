import Link from "next/link"
import { useRef, useState } from "react"
import { VideoSearchDocument, VideoSearchResultFragment } from "../generated/graphql"
import SearchIcon from "@mui/icons-material/Search"
import { useQuery } from "@apollo/client"
import CircularProgress from "@mui/material/CircularProgress"
import InputBase from "@mui/material/InputBase"
import { useDebounce, useOnClickOutside } from "usehooks-ts"
import cx from "classnames"

const SearchResults = ({
  results,
  show,
  loading,
}: {
  results?: VideoSearchResultFragment[]
  show?: boolean
  loading?: boolean
}) => {
  const className = "rounded-b-lg top-full left-0 w-full absolute flex flex-col z-100"

  if (!show) return null

  if (!results?.length) {
    return (
      <div className={className}>
        <span className={"h-[5px]"}>&nbsp;</span>
      </div>
    )
  }
  if (loading)
    return (
      <div className={className}>
        <CircularProgress />
      </div>
    )

  return (
    <div className={className}>
      {results?.map((foo) => (
        <SearchResult key={foo.id} result={foo} />
      ))}
    </div>
  )
}
const SearchResult = ({ result }: { result: VideoSearchResultFragment }) => (
  <div className={"pl-2 pr-5 pb-[5px] text-black/80 hover:text-green-900 hover:bg-green-200"}>
    <Link href={`/video/${result.id}`}>
      <div className={"flex gap-2 lg:items-center text-sm lg:text-lg"}>
        <img className={"w-8 lg:w-24 aspect-video max-md:hidden"} alt={""} src={result.images.thumbSmall} />
        <div>
          <div className={"max-lg:inline"}>{result.title}</div>
          <div className={"max-lg:inline max-lg:pl-1 text-black/50"}>{result.organization.name}</div>
        </div>
      </div>
    </Link>
  </div>
)
export const SearchFunction = ({ className }: { className?: string }) => {
  const [query, setQuery] = useState<string>("")

  // Every time the query changes, a half-second timeout before we search,
  // so a user typing will not trigger as many searches as keypresses.
  const debouncedQuery = useDebounce<string>(query, 500)

  const { data, loading } = useQuery(VideoSearchDocument, { variables: { query: debouncedQuery } })

  const [showResults, setShowResults] = useState<boolean>()
  const ref = useRef(null)

  useOnClickOutside(ref, () => setShowResults(false))
  const items = data?.video.search.items

  // bg-gradient-to-b from-green-500 to-green-700
  return (
    <div ref={ref} className={className}>
      <div className={"gap-4 my-6 flex font-bold text-2xl text-black/80 items-center"}>
        <div className={"max-lg:hidden"}>Søk</div>
        <div className={cx("m-1 grow text-black", { "rounded-b-none": showResults })}>
          <div className={"relative"}>
            <form role={"search"} className={"flex items-center border-2 border-black/80"} action={"/video/search"}>
              <SearchResults show={showResults} results={items} loading={loading} />
              <SearchIcon className={"mx-2"} />
              <InputBase
                onClick={() => setShowResults(true)}
                value={query}
                fullWidth
                name={"q"}
                className={""}
                onChange={(e) => setQuery(e.target.value)}
              />
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
