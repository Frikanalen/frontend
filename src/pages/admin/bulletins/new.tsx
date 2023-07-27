import React from "react"
import Link from "next/link"
import { Meta } from "../../../modules/core/components/Meta"
import { useRouter } from "next/router"
import { BulletinEditor } from "../../../refactor/bulletinEditor"

export const NewBulletin = () => {
  const router = useRouter()

  return (
    <div>
      <Meta meta={{ title: "Ny bulletin" }} />
      <Link href={"/admin"} passHref>
        <h1>Administratorfunksjoner</h1>
      </Link>
      <h3>Ny bulletin</h3>
      <BulletinEditor onSave={({ bulletin: { id } }) => router.push(`/admin/bulletins/${id}`)} />
    </div>
  )
}

export default NewBulletin
