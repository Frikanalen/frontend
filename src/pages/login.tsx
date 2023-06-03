import { useRouter } from "next/router"
import { useContext, useEffect } from "react"
import userContext from "../refactor/UserContext"
import Link from "next/link"
import LoginForm from "src/modules/forms/LoginForm"

export const LoginPage = () => {
  const router = useRouter()
  const { session } = useContext(userContext)

  useEffect(() => {
    if (session?.user) router.push("/user")
  }, [session, router])

  return (
    <div className={"p-8 grow flex flex-col items-center justify-center text-black"}>
      <div className={"flex justify-center max-w-xl w-full"}>
        <div
          className={
            "p-8 lg:px-12 w-full bg-gradient-to-tl rounded-2xl shadow-lg from-green-300 to-green-200 border-2 border-green-900"
          }
        >
          <LoginForm onSuccess={() => router.push("/user")} />
          <div className={"text-right text-2xl py-2"}>
            ...eller{" "}
            <Link className="font-bold underline" href={"/register"}>
              registrer ny bruker
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
