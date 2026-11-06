import { useEffect } from "react";

export default function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(onDone, 2600);
    return () => window.clearTimeout(timer);
  }, [message, onDone]);

  if (!message) return null;
  return <div className="toast" role="status">{message}</div>;
}
