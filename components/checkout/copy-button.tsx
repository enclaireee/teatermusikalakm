"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

/** Ghost "Salin" button; copies `value` and shows "Tersalin" for 2s. */
export function CopyButton({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setDone(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setDone(false), 2000);
    } catch {
      // clipboard blocked (insecure context / permission): leave the button as is
    }
  }
  return (
    <>
      <Button variant="ghost" icon={done ? "check" : "copy"} iconStart onClick={copy} aria-label={`Salin ${label}`}>
        {done ? "Tersalin" : "Salin"}
      </Button>
      <span role="status" className="sr-only">{done ? `${label} tersalin` : ""}</span>
    </>
  );
}
