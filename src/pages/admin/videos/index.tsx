import Link from "next/link"
import { DataGrid, GridColDef } from "@mui/x-data-grid"
import { format } from "date-fns"
import { nb } from "date-fns/locale"
import { Meta } from "../../../modules/core/components/Meta"
import React from "react"
import { Edit } from "@mui/icons-material"
import { GetVideosDocument } from "../../../generated/graphql"
import { useQuery } from "@apollo/client"

export const VideoAdminList = () => {
  const { data } = useQuery(GetVideosDocument)

  const videos = data?.video.list.items

  const columns: GridColDef[] = [
    {
      field: "edit",
      headerName: "",
      width: 1,
      renderCell: ({ row }) => (
        <Link href={`/admin/videos/${row.id}`} passHref>
          <Edit />
        </Link>
      ),
    },
    {
      field: "id",
      headerName: "ID",
      width: 10,
      align: "right",
      headerAlign: "right",
    },
    { field: "title", headerName: "Tittel", width: 400 },
    {
      field: "organizationName",
      headerName: "Organisasjon",
      width: 400,
      valueGetter: ({ row }) => row.organization.name,
    },
    {
      field: "createdAt",
      headerName: "Lastet opp",
      width: 400,
      valueGetter: ({ row }) => format(new Date(row.createdAt), "d. MMM Y", { locale: nb }),
    },
  ]

  return (
    <div className={"w-full"}>
      <Meta meta={{ title: "Videoer" }} />
      <Link href={"/admin"} passHref>
        <h1 className={"text-4xl font-bold p-2"}>Administratorfunksjoner</h1>
      </Link>
      <h2 className={"text-2xl font-bold p-2"}>Videoer</h2>
      <DataGrid autoHeight rows={videos ?? []} columns={columns} />
    </div>
  )
}

export default VideoAdminList
