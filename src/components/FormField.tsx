"use client";

import {
  Description,
  FieldError,
  Input as HeroInput,
  Label,
  TextArea as HeroTextArea,
  TextField,
} from "@heroui/react";
import { forwardRef, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

type SharedProps = {
  label?: ReactNode;
  labelPlacement?: "outside" | "outside-top";
  description?: ReactNode;
  isRequired?: boolean;
  isInvalid?: boolean;
  errorMessage?: ReactNode;
  classNames?: { input?: string };
  onValueChange?: (_value: string) => void;
};

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> &
  SharedProps & {
    onChange?: InputHTMLAttributes<HTMLInputElement>["onChange"];
  };

export const FormInput = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      labelPlacement,
      description,
      isRequired,
      isInvalid,
      errorMessage,
      classNames,
      className,
      onChange,
      onValueChange,
      ...inputProps
    },
    ref,
  ) => {
    void labelPlacement;
    return (
      <TextField isRequired={isRequired} isInvalid={isInvalid} className={className}>
        {label && <Label>{label}</Label>}
        {description && <Description>{description}</Description>}
        <HeroInput
          {...inputProps}
          ref={ref}
          className={classNames?.input}
          onChange={(event) => {
            onChange?.(event);
            onValueChange?.(event.currentTarget.value);
          }}
        />
        {errorMessage && <FieldError>{errorMessage}</FieldError>}
      </TextField>
    );
  },
);
FormInput.displayName = "FormInput";

type TextAreaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> &
  SharedProps & {
    onChange?: TextareaHTMLAttributes<HTMLTextAreaElement>["onChange"];
  };

export const FormTextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      label,
      labelPlacement,
      description,
      isRequired,
      isInvalid,
      errorMessage,
      classNames,
      className,
      onChange,
      onValueChange,
      ...textAreaProps
    },
    ref,
  ) => {
    void labelPlacement;
    return (
      <TextField isRequired={isRequired} isInvalid={isInvalid} className={className}>
        {label && <Label>{label}</Label>}
        {description && <Description>{description}</Description>}
        <HeroTextArea
          {...textAreaProps}
          ref={ref}
          className={classNames?.input}
          onChange={(event) => {
            onChange?.(event);
            onValueChange?.(event.currentTarget.value);
          }}
        />
        {errorMessage && <FieldError>{errorMessage}</FieldError>}
      </TextField>
    );
  },
);
FormTextArea.displayName = "FormTextArea";
