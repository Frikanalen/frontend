import { styled } from "@mui/system"
import { Meta } from "src/modules/core/components/Meta"
import { ExternalLink } from "src/modules/ui/components/ExternalLink"
import { Section } from "src/modules/ui/components/Section"
import React from "react"
import { GetServerSideProps, NextPage } from "next"
import { ParsedUrlQuery } from "querystring"
import { GetOrganizationDocument } from "../../../generated/graphql"
import { useQuery } from "@apollo/client"
import { LatestVideosGrid } from "../../../modules/organization/components/latestVideosGrid"

const breakpoint = 1250

const Container = styled("div")``

const Header = styled("div")`
  display: flex;

  @media (max-width: ${breakpoint}px) {
    flex-direction: column;
  }
`

const PrimaryInfo = styled("div")`
  flex: 1;
`

const Title = styled("h1")``

const Description = styled("div")`
  margin-top: 16px;

  white-space: pre-wrap;
  word-break: break-word;
`

const SecondaryInfo = styled("div")`
  white-space: pre-wrap;
  word-break: break-word;

  display: flex;

  @media (max-width: ${breakpoint}px) {
    flex-direction: column;
  }
`

const InfoSection = styled(Section)`
  margin-left: 32px;
  min-width: 200px;
  white-space: pre-wrap;
  line-height: 1.4;
  @media (max-width: ${breakpoint}px) {
    margin-left: 0px;
    margin-top: 32px;
  }
`

interface OrganizationPageProps {
  orgId: string
}

interface OrganizationPageParams extends ParsedUrlQuery {
  orgId: string
}

export const OrganizationPage: NextPage<OrganizationPageProps> = ({ orgId }) => {
  const query = useQuery(GetOrganizationDocument, { variables: { orgId: orgId } })

  if (!query.data?.organization) return null

  const { name, description, postalAddress, streetAddress, editor } = query.data.organization

  return (
    <Container>
      <Meta
        meta={{
          title: name,
          description: description || "",
        }}
      />
      <Header>
        <PrimaryInfo>
          <Title>{name}</Title>
          <Description>{description}</Description>
        </PrimaryInfo>
        <SecondaryInfo>
          <InfoSection icon="pencil" title="Redaktør">
            {editor.name}
            <br />
            <ExternalLink href={`mailto:${editor.email}`}>{editor.email}</ExternalLink>
          </InfoSection>
          <InfoSection icon="mail" title="Postadresse">
            {postalAddress}
          </InfoSection>
          <InfoSection icon="home" title="Besøksadresse">
            {streetAddress}
          </InfoSection>
        </SecondaryInfo>
      </Header>
      <LatestVideosGrid organizationId={orgId} />
    </Container>
  )
}

export const getServerSideProps: GetServerSideProps<OrganizationPageProps> = async (ctx) => {
  const { orgId } = ctx.params as OrganizationPageParams

  return { props: { orgId: orgId } }
}

export default OrganizationPage
