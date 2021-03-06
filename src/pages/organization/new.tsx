import { styled } from "@mui/system"
import { observer } from "mobx-react-lite"
import {
  getInitialRequireAuthenticationProps,
  RequireAuthentication,
} from "src/modules/auth/components/RequireAuthentication"
import { Meta } from "src/modules/core/components/Meta"
import { Form } from "src/modules/form/components/Form"
import { FormField, FormFieldWithProps } from "src/modules/form/components/FormField"
import { useFormSubmission } from "src/modules/form/hooks/useFormSubmission"
import { ControlledTextInput } from "src/modules/input/components/ControlledTextInput"
import { toTitleCase } from "src/modules/lang/string"
import { createNewOrganizationForm } from "src/modules/organization/forms/createNewOrganizationForm"
import { fetchBrregData } from "src/modules/organization/helpers/fetchBrregData"
import { formatAddress } from "src/modules/organization/helpers/formatAddress"
import { OrganizationData } from "src/modules/organization/resources/Organization"
import { useManager } from "src/modules/state/manager"
import { ExternalLink } from "src/modules/ui/components/ExternalLink"
import { GenericButton } from "src/modules/ui/components/GenericButton"
import { Notice } from "src/modules/ui/components/Notice"
import { StatusLine } from "src/modules/ui/components/StatusLine"
import { useStatusLine } from "src/modules/ui/hooks/useStatusLine"
import { useRouter } from "next/router"
import React, { useEffect, useState } from "react"

const breakpoint = 900

const Container = styled("div")`
  display: flex;

  @media (max-width: ${breakpoint}px) {
    flex-direction: column;
  }
`

const FormContainer = styled("div")`
  flex: 1;

  display: grid;
  align-content: start;

  grid-template-columns: 1fr 1fr;
  grid-template-areas: "number name" "homepage homepage" "postal street" "footer footer";
  gap: 24px;

  @media (max-width: ${breakpoint}px) {
    grid-template-areas: "number number" "name name" "homepage homepage" "postal street" "footer footer";
  }
`

const FormFooter = styled("div")`
  display: flex;
  justify-content: space-between;
  align-items: center;

  grid-area: footer;
`

const Info = styled("div")`
  width: 700px;
  margin-left: 32px;

  @media (max-width: ${breakpoint}px) {
    width: 100%;

    margin-left: 0px;
    margin-bottom: 32px;

    order: -1;
  }
`

const Field = styled(FormField as FormFieldWithProps<{ area: string }>)`
  grid-area: ${(props) => props.area};
`

const Content = observer(() => {
  const router = useRouter()
  const manager = useManager()

  const { networkStore, organizationStore } = manager.stores
  const { api } = networkStore

  const [form] = useState(() => createNewOrganizationForm(manager))

  const [status, setStatus] = useStatusLine()

  const organizationNumber = form.fields.brregNumber.value

  useEffect(() => {
    const doFetch = async () => {
      setStatus("loading", "Henter data fra registeret...")

      const data = await fetchBrregData(organizationNumber)

      if (!data) {
        setStatus("error", "Kunne ikke hente data fra register, er organisasjonsnummer riktig?")
        return
      }

      const safeName = toTitleCase(data.navn)
      const { name, postalAddress, streetAddress, homepage } = form.fields

      name.setValue(safeName)
      postalAddress.setValue(`${safeName}\n${formatAddress(data.postadresse)}`)
      streetAddress.setValue(`${safeName}\n${formatAddress(data.forretningsadresse)}`)
      homepage.setValue(data.hjemmeside)
    }

    if (organizationNumber.length === 9 && Number.isInteger(Number(organizationNumber))) {
      doFetch()
    }
  }, [organizationNumber, form, setStatus])

  const [formStatus, handleSubmit] = useFormSubmission(form, async (serialized) => {
    const { data } = await api.post<OrganizationData>("/organizations/", serialized)

    organizationStore.add(data)
    router.push(`/organization/${data.id}`)
  })

  // Pass automatic form status along to manual one
  useEffect(() => {
    const { type, message } = formStatus
    setStatus(type, message)
  }, [formStatus, setStatus])

  return (
    <Form onSubmit={handleSubmit} form={form}>
      <Meta
        meta={{
          title: "Opprett medlemskap",
          description: "",
        }}
      />
      <Container>
        <FormContainer>
          <Field area="number" label="Organisasjonsnummer" name="brregNumber">
            <ControlledTextInput placeholder="9 siffer" autoFocus name="brregNumber" />
          </Field>
          <Field area="name" label="Organisasjonsnavn" name="name">
            <ControlledTextInput name="name" />
          </Field>
          <Field area="homepage" label="Hjemmeside" name="homepage">
            <ControlledTextInput placeholder="https://webside.no" name="homepage" />
          </Field>
          <Field area="postal" label="Postadresse" name="postalAddress">
            <ControlledTextInput multiline name="postalAddress" />
          </Field>
          <Field area="street" label="Bes??ksadresse" name="streetAddress">
            <ControlledTextInput multiline name="streetAddress" />
          </Field>
          <FormFooter>
            <StatusLine {...status} />
            <GenericButton variant="primary" onClick={handleSubmit} label="Opprett" />
          </FormFooter>
        </FormContainer>
        <Info>
          <h2>Opprett medlemskap</h2>
          <p>Her kan du opprette en ny organisasjon i v??r database.</p>
          <p>
            Du vil umiddelbart kunne laste opp innhold, men for at organisasjonens innhold skal v??re synlig for andre
            eller sendes p?? sendeplanen, m?? betalt kontingent v??re registrert, og en redakt??rerkl??ring v??re mottatt.
          </p>
          <p>
            Privatpersoner kan ogs?? melde seg inn i Frikanalen og sende innhold som en organisasjon, men de vil likevel
            m??tte inkludere bes??ks- og postadresse i henhold til{" "}
            <ExternalLink href="https://lovdata.no/lov/1992-12-04-127/??2-16">Kringkastingsloven ??2-16</ExternalLink>, og
            vil ikke ha medlemsrettigheter i Frikanalen, som blant annet stemmerett.
          </p>
          <p>
            En mal for redakt??rerkl??ring vil v??re tilgjengelig for nedlasting p?? organisasjonens side. Utelat i s?? fall
            organisasjonsnummer, sett organisasjonsnavn til ditt fulle navn.
          </p>
          <Notice
            type="tip"
            message="Tast inn organisasjonsnummer for ?? automatisk hente navn og postadresse fra Br??nn??ysund"
          />
        </Info>
      </Container>
    </Form>
  )
})

export default function NewOrganization() {
  return (
    <RequireAuthentication>
      <Content />
    </RequireAuthentication>
  )
}

NewOrganization.getInitialProps = getInitialRequireAuthenticationProps
