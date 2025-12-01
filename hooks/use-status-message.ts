import { useCallback, useState } from "react";

export function useStatusMessage() {
  const [statusMessage, setStatusMessage] = useState("");

  const announce = useCallback((message: string) => {
    setStatusMessage(message);
    setTimeout(() => setStatusMessage(""), 3000);
  }, []);

  return {
    statusMessage,
    announce,
  };
}
