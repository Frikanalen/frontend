import { ParsedUrlQuery } from "querystring"
import { GetServerSideProps } from "next"
import React from "react"
import Link from "next/link"
import { Meta } from "../../../modules/core/components/Meta"
import { useQuery } from "@apollo/client"
import { GetBulletinDocument } from "../../../generated/graphql"
import { RequireAuthentication } from "../../../modules/core/components/RequireAuthentication"

import { BulletinEditor } from "../../../refactor/bulletinEditor"

interface BulletinDetailParams extends ParsedUrlQuery {
  bulletinId: string
}

interface BulletinDetailProps {
  bulletinId: string
}

export const BulletinDetail = ({ bulletinId }: BulletinDetailProps) => {
  const { data, refetch } = useQuery(GetBulletinDocument, { variables: { bulletinId } })

  if (!data?.bulletin) return null

  return (
    <RequireAuthentication>
      <div>
        <Meta meta={{ title: "Rediger bulletin" }} />
        <Link href={"/admin"} passHref>
          <h1>Administratorfunksjoner</h1>
        </Link>
        <h3>Rediger bulletin</h3>
        <BulletinEditor value={data?.bulletin} onSave={() => refetch()} />
      </div>
    </RequireAuthentication>
  )
}

export const getServerSideProps: GetServerSideProps<BulletinDetailProps> = async (ctx) => {
  const { bulletinId } = ctx.params as BulletinDetailParams

  return { props: { bulletinId } }
}

export default BulletinDetail
