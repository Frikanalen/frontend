import { Alert, Button, InputLabel, TextField } from "@mui/material"
import React from "react"
import { ApolloError, useMutation } from "@apollo/client"
import { LoginDocument, MutationStatus } from "../../generated/graphql"
import { FieldValues, useForm } from "react-hook-form"
import { nopeResolver } from "@hookform/resolvers/nope"
import { ErrorMessage } from "@hookform/error-message"
import { LoginSchema } from "./schemas"
import { AnyCnameRecord } from "dns"

export const LoginForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const {
    register,
    setError,
    formState: { errors },
    handleSubmit,
  } = useForm({ resolver: nopeResolver(LoginSchema) })

  const [mutate] = useMutation(LoginDocument, {
    refetchQueries: ["GetSession"],
    onError: (e: any) => {
      if (e instanceof ApolloError)
        setError("backend", { type: "custom", message: e.message })
      else
        setError("backend", { type: "custom", message: e })
    },
    onCompleted: ({ user }) => {
      if (user.login.status === MutationStatus.Success) onSuccess()
      else setError("backend", { type: "custom", message: "Ukjent feil" })
    },
  })

  const onSubmit = async ({ email, password }: FieldValues) => await mutate({ variables: { email, password } })

  return (
    <div>
      <h4 className={"py-4 text-2xl lg:text-4xl font-bold"}>Logg inn</h4>
      <form className={"py-4 space-y-3"}>
        <div className={"space-y-2"}>
          <InputLabel className="text-xl" htmlFor={"login-email"}>
            Epost
          </InputLabel>
          <TextField
            className={"block bg-green-100"}
            {...register("email")}
            fullWidth
            autoFocus
            autoComplete={"email"}
            id={"login-email"}
          />
          <ErrorMessage errors={errors} name={"email"} />
        </div>
        <div className={"space-y-2"}>
          <InputLabel className="text-xl" htmlFor={"login-password"}>
            Passord
          </InputLabel>
          <TextField
            {...register("password")}
            className={"block bg-green-100"}
            fullWidth
            type={"password"}
            autoComplete={"current-password"}
            id={"login-password"}
          />
          <ErrorMessage errors={errors} name={"password"} />
        </div>
      </form>
      <div className={"py-1"}>
        {errors.backend &&
          <Alert severity="error">
            <ErrorMessage errors={errors} name={"backend"} />
          </Alert>
        }
      </div>
      <div className={"py-4"}>
        <Button
          className="p-2 w-full text-xl bg-green-100 text-green-900 hover:bg-green-200"
          variant="contained"
          onClick={handleSubmit(onSubmit)}
        >
          Logg inn
        </Button>
      </div>
    </div>
  )
}

export default LoginForm
