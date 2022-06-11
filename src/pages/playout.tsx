import { useState } from "react"
import { styled } from "@mui/system"
import { ATEMControls } from "src/modules/playout/components/ATEMControls"
import { MonitoringStream } from "src/modules/playout/components/MonitoringStream"
import { ATEM_INPUTS } from "src/modules/playout/constants"
import { Section } from "src/modules/ui/components/Section"
import { useManager } from "src/modules/state/manager"
import { GenericButton } from "src/modules/ui/components/GenericButton"
import { spawnTextSlideModal } from "src/modules/playout/helpers/spawnTextSlideModal"
import { Meta } from "src/modules/core/components/Meta"
import { NextPageContext } from "next"
// import { NextPageContext } from "next";

const breakpoint = 830

const Container = styled("div")``

const Content = styled("div")`
  margin-top: 16px;
  padding: 24px;
  border: solid 2px ${(props) => props.theme.palette.divider};
  border-radius: 4px;

  @media (max-width: ${breakpoint}px) {
    padding: 0px;
  }
`

const Controls = styled("div")`
  margin: 0px -24px;
  border-top: solid 2px ${(props) => props.theme.palette.divider};

  padding: 0px 24px;
  padding-top: 24px;

  margin-top: 24px;
  display: flex;

  > * {
    margin-right: 32px;
  }

  @media (max-width: ${breakpoint}px) {
    margin: 0px;

    flex-direction: column;

    > * {
      margin-right: 0px;
      margin-bottom: 32px;
    }
  }
`

export type PlayoutProps = {
  initialIndex: number
}

export default function Playout(props: PlayoutProps) {
  const manager = useManager()
  const { networkStore } = manager.stores
  const { api } = networkStore

  const { initialIndex } = props
  const [index, setIndex] = useState(initialIndex)

  const setProgram = async (index: number) => {
    await api.post("/playout/atem/program", { inputIndex: index })
    setIndex(index)
  }

  return (
    <Container>
      <Meta
        meta={{
          title: "Playout",
          description: "",
        }}
      />
      <h1>Playout</h1>
      <Content>
        <MonitoringStream />
        <Controls>
          <Section icon="lightbulb" title="Handlinger">
            <GenericButton
              variant="primary"
              label="Rediger sendingsplakat"
              onClick={() => spawnTextSlideModal(manager)}
            />
          </Section>
          <Section icon="camera" title="Programutgang">
            <ATEMControls inputs={ATEM_INPUTS} index={index} onChange={setProgram} />
          </Section>
        </Controls>
      </Content>
    </Container>
  )
}

Playout.getInitialProps = async () => {
  //const { manager } = context
  //const { networkStore } = manager.stores
  //const { api } = networkStore

  //const { data } = await api.get<{ inputIndex: number }>("/playout/atem/program")
  //const { inputIndex } = data

  return { initialIndex: -1 }
}
