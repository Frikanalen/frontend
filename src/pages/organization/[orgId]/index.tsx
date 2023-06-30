import { Meta } from "src/modules/core/components/Meta"
import { Section } from "src/modules/ui/components/Section"
import React, { useContext } from "react"
import { GetServerSideProps, NextPage } from "next"
import { ParsedUrlQuery } from "querystring"
import { GetOrganizationDocument, GetOrganizationQuery, Organization } from "../../../generated/graphql"
import { useQuery } from "@apollo/client"
import { LatestVideosGrid } from "../../../modules/organization/components/latestVideosGrid"
import ReactMarkdown from "react-markdown"
import Link from "next/link"
import UserContext from "../../../refactor/UserContext"
import { Button } from "../../../modules/ui/components/Button"
import { useRouter } from "next/router"

const LegalInfo = ({ organization: { editor, postalAddress, streetAddress } }: GetOrganizationQuery) => (
  <div className={"flex max-w-3xl whitespace-pre-wrap leading-6 justify-between"}>
    <Section icon="pencil" title="Redaktør">
      {editor.name}
      <br />
      <Link href={`mailto:${editor.email}`}>{editor.email}</Link>
    </Section>
    <Section icon="mail" title="Postadresse">
      {postalAddress}
    </Section>
    <Section icon="home" title="Besøksadresse">
      {streetAddress}
    </Section>
  </div>
)

interface OrganizationPageProps {
  orgId: string
}

export interface OrganizationPageParams extends ParsedUrlQuery {
  orgId: string
}

const EditorPanel = ({ organization }: { organization: Pick<Organization, "id" | "name"> }) => {
  const { setActiveOrganization } = useContext(UserContext)
  const router = useRouter()

  return (
    <div className={"bg-orange-200 p-4 space-y-4 border-2 border-black"}>
      <h4 className="text-xl font-bold">Redaktørpanel</h4>
      <Button
        onClick={() => {
          setActiveOrganization(organization)
          router.push("/user")
        }}
      >
        Ny video
      </Button>
    </div>
  )
}

export const OrganizationPage: NextPage<OrganizationPageProps> = ({ orgId }) => {
  const { data } = useQuery(GetOrganizationDocument, { variables: { orgId } })
  const { session } = useContext(UserContext)
  if (!data?.organization) return null
  const { organization } = data
  const { name, description, latestVideos, editor } = organization

  const isEditor = editor.id === session?.user?.id

  return (
    <div className={"pt-4 max-w-5xl flex flex-col justify-between min-h-full"}>
      <Meta
        meta={{
          title: name,
          description: description || "",
        }}
      />
      <div>
        <h2 className={"text-5xl text-green-800 font-black "}>{name}</h2>
        <div className={"prose-lg prose description py-3"}>
          <ReactMarkdown>{description || ""}</ReactMarkdown>
        </div>
        <LatestVideosGrid latestVideos={latestVideos} />
      </div>
      <div id={"grow"}>&nbsp;</div>
      {isEditor && <EditorPanel organization={organization} />}
      <LegalInfo organization={organization} />
    </div>
  )
}

export const getServerSideProps: GetServerSideProps<OrganizationPageProps> = async (ctx) => {
  const { orgId } = ctx.params as OrganizationPageParams

  return { props: { orgId } }
}

export default OrganizationPage
