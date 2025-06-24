import { connectMessage } from "../react-tostify/popup";

export const checkConnection = (isConnected: boolean) => {
  if (!isConnected) return connectMessage();
};
