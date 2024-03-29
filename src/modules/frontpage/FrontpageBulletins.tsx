import ReactMarkdown from "react-markdown"
import { format } from "date-fns"
import { nb } from "date-fns/locale"
import { GetBulletinsDocument } from "../../generated/graphql"
import { useQuery } from "@apollo/client"

export const FrontpageBulletins = () => {
  const query = useQuery(GetBulletinsDocument, { variables: { perPage: 2 }, onError: console.log })

  const bulletins = query.data?.bulletins.items

  return (
    <div className="space-y-4">
      {bulletins?.map(({ id, title, createdAt, text }) => (
        <div key={id} className={"shadow-md"}>
          <div className={"bg-gradient-to-b from-red-900/80 to-red-900/95 text-red-100 p-4"}>
            <h4 className={"lg:text-3xl font-bold tracking-wide"}>{title}</h4>
            <div className={"text-red-200 text-lg"}>{format(new Date(createdAt), "d. MMM Y", { locale: nb })}</div>
          </div>
          <div
            className={
              "border-gray-100 border-1 border-t-0 px-4 py-2 pb-4 prose prose-sm lg:prose-lg prose-heading:font-sans min-w-full"
            }
          >
            <ReactMarkdown>{text}</ReactMarkdown>
          </div>
        </div>
      ))}
    </div>
  )
}
