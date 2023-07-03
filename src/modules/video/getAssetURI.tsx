import { VideoMediaAsset } from "src/generated/model"

// Given a list of assets and a type string, returns URI
export const getAssetURI = (assets: VideoMediaAsset[], assetType: string) =>
  assets.find(({ type }) => type === assetType)?.url
