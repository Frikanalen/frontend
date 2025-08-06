import { AxiosHeaders } from "axios";
import { userRetrieve } from "@/generated/user/user";

export const getUserOrNull = async (headers: AxiosHeaders) => {
  try {
    const res = await userRetrieve({ headers });
    return res.data;
  } catch {
    return null;
  }
};
