import { Card, CardContent, CardHeader } from "@mui/material"
import { AddBox } from "@mui/icons-material"
import Link from "next/link"
import { format } from "date-fns"
import { nb } from "date-fns/locale"
import ReactMarkdown from "react-markdown"
import { Meta } from "../../../modules/core/components/Meta"
import React from "react"
import { useQuery } from "@apollo/client"
import { Bulletin, GetBulletinsDocument } from "../../../generated/graphql"
import { RequireAuthentication } from "../../../modules/core/components/RequireAuthentication"

const BulletinCard = ({ bulletin }: { bulletin: Bulletin }) => {
  const { id, title, text, createdAt } = bulletin

  return (
    <Link href={`bulletins/${id}`} passHref legacyBehavior>
      <Card
        className={"h-[250px] basis-[200px] shrink-0 cursor-pointer transition hover:bg-red-400 hover:text-orange-300"}
      >
        <CardHeader title={title} subheader={format(new Date(createdAt), "d. MMM yyyy", { locale: nb })} />
        <CardContent>
          <ReactMarkdown>{text}</ReactMarkdown>
        </CardContent>
      </Card>
    </Link>
  )
}

const NewBulletinCard = () => (
  <Link href={"bulletins/new"} passHref legacyBehavior>
    <Card
      className={"h-[250px] basis-[200px] shrink-0 cursor-pointer transition hover:bg-red-400 hover:text-orange-300"}
    >
      <CardContent
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
        }}
      >
        <AddBox sx={{ fontSize: 72, display: "block", marginBottom: ".5em" }} />
        Ny bulletin
      </CardContent>
    </Card>
  </Link>
)

export const BulletinAdminPage = () => {
  const query = useQuery(GetBulletinsDocument, { variables: { perPage: 50 } })
  const bulletins = query.data?.bulletins.items

  return (
    <RequireAuthentication>
      <div>
        <Meta meta={{ title: "Administrer bulletins" }} />
        <Link href={"/admin"} passHref>
          <h1>Administratorfunksjoner</h1>
        </Link>
        <h2>Bulletins</h2>
        <div className={"flex flex-wrap gap-2"}>
          <NewBulletinCard />
          {bulletins?.map((bulletin) => <BulletinCard key={bulletin.id} bulletin={bulletin} />)}
        </div>
      </div>
    </RequireAuthentication>
  )
}

export default BulletinAdminPage
