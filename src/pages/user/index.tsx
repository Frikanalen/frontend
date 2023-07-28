import React, { useContext } from "react"
import NewVideo from "../../modules/videoNew/NewVideo"
import userContext from "../../refactor/UserContext"
import { UserPageLayout } from "../../refactor/user/UserPageLayout"

const Index = () => {
  const { activeOrganization } = useContext(userContext)

  return <UserPageLayout>{activeOrganization && <NewVideo orgId={activeOrganization.id} />}</UserPageLayout>
}

export default Index
