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
  /**
   * Makes the field controlled. React Aria's TextField otherwise keeps its
   * own copy of the value, so a value set from code (react-hook-form's
   * setValue) is overwritten on the next render.
   */
  value?: string;
};

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "defaultValue"> &
  SharedProps & {
    defaultValue?: string;
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
      defaultValue,
      value,
      onChange,
      onValueChange,
      ...inputProps
    },
    ref,
  ) => {
    void labelPlacement;

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(event);
      onValueChange?.(event.currentTarget.value);
    };

    return (
      <TextField
        isRequired={isRequired}
        isInvalid={isInvalid}
        className={className}
        defaultValue={defaultValue}
        value={value}
      >
        {label && <Label>{label}</Label>}
        {description && <Description>{description}</Description>}
        <HeroInput
          {...inputProps}
          ref={ref}
          className={classNames?.input}
          onChange={handleChange}
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
      value,
      onChange,
      onValueChange,
      ...textAreaProps
    },
    ref,
  ) => {
    void labelPlacement;
    return (
      <TextField isRequired={isRequired} isInvalid={isInvalid} className={className} value={value}>
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
