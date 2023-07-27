import Link from "next/link"
import React from "react"
import { Section } from "../modules/ui/components/Section"
import { UserRolesFragment } from "../generated/graphql"
import { Button } from "@mui/material"
import { UserRoleCard } from "../modules/ui/components/UserRoleCard"

interface UserRoleListProps {
  roles?: Array<UserRolesFragment>
}

export const UserRoleList = ({ roles }: UserRoleListProps) => (
  <Section icon="officeBuilding" title="Organisasjoner du er medlem av">
    {roles?.map((r, idx) => <UserRoleCard key={idx} role={r} />)}
    <div>
      <Button variant={"outlined"}>
        <Link href={"/organization/new"} passHref>
          Ny organisasjon
        </Link>
      </Button>
    </div>
  </Section>
)
