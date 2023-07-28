import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { FieldValues, useForm } from "react-hook-form"
import { InputLabel, TextField, Button, Alert } from "@mui/material"
import { ErrorMessage } from "@hookform/error-message"
import React, { useCallback } from "react"
import { useNewVideo } from "../../generated/video/video"
import { VideoUpload } from "../videoNew/VideoUpload"

interface VideoCreationFormProps {
  mediaId?: string
  onCreated: (videoId: number, uploadId: string) => void
  organizationId: string
}

const CreateVideoSchema = z.object({
  title: z.string().nonempty("Videoen må ha en tittel"),
  mediaId: z.number({ required_error: "Du må laste opp en fil" }),
})

type CreateVideoForm = z.infer<typeof CreateVideoSchema>

export const VideoCreationForm = ({ organizationId, onCreated }: VideoCreationFormProps) => {
  const {
    setValue,
    register,
    formState: { errors },
    handleSubmit,
    watch,
  } = useForm<CreateVideoForm>({ resolver: zodResolver(CreateVideoSchema) })

  const [backendError, setBackendError] = React.useState<string | null>()
  const { mutate } = useNewVideo()
  const [uploadId, setUploadId] = React.useState<string | null>(null)

  const onSubmit = async ({ title, mediaId }: FieldValues) => {
    // FIXME
    if (!mediaId) return
    await mutate(
      {
        orgId: parseInt(organizationId),
        data: {
          title,
          mediaId,
        },
      },
      {
        onError: (e) => setBackendError(e.message),
        onSuccess: ({ id }) => {
          onCreated(id, uploadId!)
        },
      },
    )
  }
  const onJobCreated = useCallback(
    (mediaId: number, uploadId: string) => {
      setValue("mediaId", mediaId)
      setUploadId(uploadId)
    },
    [setValue],
  )

  return (
    <form>
      <div className={"flex flex-col gap-5 pt-2 pb-4"}>
        <InputLabel className={"text-xl font-bold text-black"} htmlFor={"video-title"}>
          Tittel
        </InputLabel>
        <TextField {...register("title")} className={"bg-white rounded-md"} fullWidth autoFocus id={"video-title"} />
        <div>
          &nbsp;
          <ErrorMessage errors={errors} name={"title"} />
        </div>
        <VideoUpload onJobCreated={onJobCreated} />
        <div>
          &nbsp;
          <ErrorMessage name={"mediaId"} errors={errors} />
        </div>
        <div className="ml-auto">
          <Button
            className="text-black bg-white/20 hover:text-white"
            variant="contained"
            disabled={!watch("mediaId")}
            onClick={handleSubmit(onSubmit)}
          >
            Fortsett
          </Button>
        </div>
        {backendError && <Alert severity={"error"}>{backendError}</Alert>}
      </div>
    </form>
  )
}
