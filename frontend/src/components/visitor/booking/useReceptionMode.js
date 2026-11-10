import { useState } from "react";
import {
  isReceptionMode,
  setReceptionMode as storeReceptionMode,
} from "../../../services/visitorDevice";

export default function useReceptionMode() {
  const [receptionMode, setReceptionMode] = useState(isReceptionMode);

  const turnOffReceptionMode = () => {
    setReceptionMode(false);
    storeReceptionMode(false);
  };

  return [receptionMode, turnOffReceptionMode];
}
