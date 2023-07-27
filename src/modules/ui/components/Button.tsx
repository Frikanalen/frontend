import React, { ComponentPropsWithoutRef } from "react"
import cx from "classnames"
export type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  stretch?: boolean
}

export const Button = React.forwardRef((props: ButtonProps, ref: React.Ref<HTMLButtonElement>) => {
  const { stretch, className = "", children, type = "button", ...rest } = props

  const buttonStyle = cx(
    "inline-block border-2 text-black/80 border-black/50 rounded-md bg-white/50 py-1 px-3",
    stretch && "w-full",
  )
  const buttonContentStyle = cx("flex select-none", className)

  return (
    <button className={buttonStyle} ref={ref} type={type} {...rest}>
      <span className={buttonContentStyle}>{children}</span>
    </button>
  )
})

export type ButtonWithProps<T extends object> = (
  props: ButtonProps & { ref?: React.Ref<HTMLButtonElement> } & T,
) => JSX.Element
