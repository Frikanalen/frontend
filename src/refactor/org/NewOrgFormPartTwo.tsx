import { FieldValues, useForm } from "react-hook-form"
import { nopeResolver } from "@hookform/resolvers/nope"
import { TextField } from "@mui/material"
import React from "react"
import Nope from "nope-validator"
import { ErrorMessage } from "@hookform/error-message"
import { MutateOrganizationDocument } from "../../generated/graphql"
import { useMutation } from "@apollo/client"
import { OrgdataFromBrreg } from "../../modules/organization/helpers/fetchBrregData"
import { Button } from "../../modules/ui/components/Button"

const NewOrgDetailSchema = Nope.object().shape({
  name: Nope.string().required().min(3),
  postalAddress: Nope.string().required(),
  streetAddress: Nope.string().required(),
  homepage: Nope.string().url(),
})

export const NewOrgFormPartTwo = ({
  brregData,
  onCreated,
}: {
  brregData: OrgdataFromBrreg
  onCreated: (newOrgId: string) => Promise<any>
}) => {
  const {
    register,
    setError,
    formState: { errors },
    handleSubmit,
  } = useForm({ resolver: nopeResolver(NewOrgDetailSchema), defaultValues: { ...brregData, backend: undefined } })

  const [mutate] = useMutation(MutateOrganizationDocument, {
    variables: { organization: { brregId: brregData.brregId } },
    onError: (e) => setError("backend", { type: "custom", message: "Serverfeil:" + e.message }),
    onCompleted: (data) => onCreated(data.organization.id),
  })

  const onSubmit = async (newOrg: FieldValues) => await mutate({ variables: { organization: newOrg } })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={"flex flex-col gap-4"}>
      <div>Sjekk informasjon og opprett organisasjon</div>
      <div>
        <TextField {...register("name")} fullWidth label="Organisasjonsnavn" />
        <ErrorMessage errors={errors} name={"name"} />
      </div>
      <div>
        <TextField {...register("homepage")} fullWidth label="Hjemmeside" />
        <ErrorMessage errors={errors} name={"homepage"} />
      </div>
      <div className={"flex gap-4"}>
        <div className={"grow"}>
          <TextField fullWidth multiline minRows={4} {...register("postalAddress")} label="Postadresse" />
          <ErrorMessage errors={errors} name={"postalAddress"} />
        </div>
        <div className={"grow"}>
          <TextField fullWidth multiline minRows={4} {...register("streetAddress")} label="Besøksadresse" />
          <ErrorMessage errors={errors} name={"streetAddress"} />
        </div>
      </div>
      <div className={"ml-auto"}>
        <Button type={"submit"}>Opprett</Button>
      </div>
      <ErrorMessage
        errors={errors}
        name={"backend"}
        render={({ message }) => <code className={"backendError"}>{message}</code>}
      />
    </form>
  )
}
