import { css, keyframes } from "@emotion/react"
import { styled } from "@mui/system"
import { useEffect, useRef, useState } from "react"
import { Transition, TransitionGroup, TransitionStatus } from "react-transition-group"
import { IconType } from "../types"
import { Spinner } from "./Spinner"
import { SVGIcon } from "./SVGIcon"

const Container = styled("div")`
  font-size: 0.8em;
  font-weight: 600;

  position: relative;

  flex: 1;
  height: 100%;
`

const EnterAnimation = keyframes`
  0% {
    opacity: 0;
    transform: translateY(-20%);
  }

  100% {
    opacity: 1;
    transform: translateY(-50%);
  }
`

const ExitAnimation = keyframes`
  0% {
    opacity: 1;
    transform: translateY(-50%);
  }

  100% {
    opacity: 0;
    transform: translateY(-80%);
  }
`

const Content = styled("span")<{ type: StatusType; status: TransitionStatus }>`
  display: flex;
  align-items: center;

  position: absolute;

  top: 50%;
  transform: translateY(-50%);

  left: 0px;
  right: 0px;

  ${(props) => {
    if (props.type === "error") {
      return css`
        color: ${props.theme.palette.error.main};
      `
    }

    if (props.type === "success") {
      return css`
        color: ${props.theme.palette.success.main};
      `
    }

    return css`
      color: ${props.theme.palette.text.secondary};
    `
  }}

  ${(props) => {
    if (props.status === "entering")
      return css`
        animation: ${EnterAnimation} 150ms ease forwards;
      `

    if (props.status === "exiting") {
      return css`
        animation: ${ExitAnimation} 150ms ease forwards;
      `
    }
  }}
`

const Icon = styled(SVGIcon)`
  width: 24px;
  height: 24px;

  margin-right: 8px;
`

const Loading = styled(Spinner)`
  margin-right: 8px;
`

const statusTimeout = 15000

const typeToIconMap: Record<StatusType, IconType | undefined> = {
  loading: undefined,
  info: undefined,
  success: "circledCheckmark",
  error: "triangularExclamation",
}

export type StatusType = "info" | "loading" | "success" | "error"

export type StatusLineProps = {
  type: StatusType
  fingerprint: number
  message?: string
  fadeOut?: boolean
  className?: string
}

export function StatusLine(props: StatusLineProps) {
  const { type, className, message, fingerprint, fadeOut = true } = props
  const icon = typeToIconMap[type]

  const timeoutRef = useRef<number>()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    timeoutRef.current = window.setTimeout(() => {
      if (fadeOut) {
        setVisible(false)
      }
    }, statusTimeout)

    setVisible(true)

    return () => {
      clearTimeout(timeoutRef.current)
    }
  }, [fingerprint, fadeOut])

  const renderSpinner = () => {
    if (type !== "loading") return null

    return <Loading size="small" />
  }

  const renderIcon = () => {
    if (!icon) return null

    return <Icon name={icon} />
  }

  const renderStatus = () => {
    if (!visible && type !== "loading") return null

    return (
      <Transition timeout={150} key={type + message}>
        {(status) => (
          <Content status={status} type={type}>
            {renderSpinner()}
            {renderIcon()}
            {message}
          </Content>
        )}
      </Transition>
    )
  }

  return (
    <Container className={className}>
      <TransitionGroup>{renderStatus()}</TransitionGroup>
    </Container>
  )
}
