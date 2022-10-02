import { VideoAsset } from "../../generated/graphql"
import getConfig from "next/config"
const { publicRuntimeConfig } = getConfig()

// Given a list of assets and a type string, returns URI
export const getAssetURI = (assets: VideoAsset[], assetType: string) => {
  const path = assets.find(({ type }) => type === assetType)?.path
  return publicRuntimeConfig.FK_MEDIA + "/" + path
}
