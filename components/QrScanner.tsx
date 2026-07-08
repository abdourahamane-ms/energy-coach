"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type DemoQr = { name: string; payload: string; image: string; type: string };

export default function QrScanner({ demoQrs }: { demoQrs: DemoQr[] }) {
  const router = useRouter();
  const [manual, setManual] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">(
    "idle"
  );
  const [message, setMessage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const scannerRef = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(
    null
  );

  async function submit(payload: string) {
    if (!payload.trim()) return;
    setStatus("loading");
    setMessage(null);
    try {
      const res = await fetch("/api/scan-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "QR code non reconnu.");
        return;
      }
      setStatus("ok");
      setMessage(data.message ?? "Simulation compteur activée.");
      await stopCamera();
      router.refresh();
    } catch {
      setStatus("error");
      setMessage("Une erreur est survenue. Veuillez réessayer.");
    }
  }

  async function startCamera() {
    setMessage(null);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const el = document.getElementById("qr-reader");
      if (!el) return;
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner as unknown as {
        stop: () => Promise<void>;
        clear: () => void;
      };
      setCameraActive(true);
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 220 },
        (decoded) => {
          submit(decoded);
        },
        () => {}
      );
    } catch {
      setCameraActive(false);
      setMessage(
        "La caméra n'est pas disponible sur cet appareil. Utilisez la saisie manuelle ou un QR code de démonstration ci-dessous."
      );
    }
  }

  async function stopCamera() {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      }
    } catch {
      /* ignore */
    }
    setCameraActive(false);
  }

  return (
    <div className="space-y-6">
      {/* Messages */}
      {status === "ok" && message && (
        <div className="ec-card border-[var(--primary)] bg-[var(--primary-soft)]/50">
          <p className="font-medium text-[var(--primary-hover)]">{message}</p>
          <div className="mt-3 flex gap-3">
            <button
              onClick={() => router.push("/diagnostic")}
              className="ec-btn ec-btn-primary"
            >
              Voir mon diagnostic
            </button>
            <button
              onClick={() => router.push("/tableau-de-bord")}
              className="ec-btn ec-btn-ghost"
            >
              Tableau de bord
            </button>
          </div>
        </div>
      )}
      {status === "error" && message && (
        <div className="ec-card border-red-200 bg-red-50">
          <p className="text-sm text-[var(--danger)]">{message}</p>
        </div>
      )}

      {/* Caméra */}
      <div className="ec-card">
        <h2 className="font-semibold mb-3">Scanner avec la caméra</h2>
        <div
          id="qr-reader"
          className="mx-auto max-w-sm overflow-hidden rounded-lg"
        />
        <div className="mt-3 flex gap-3">
          {!cameraActive ? (
            <button onClick={startCamera} className="ec-btn ec-btn-primary">
              Démarrer la caméra
            </button>
          ) : (
            <button onClick={stopCamera} className="ec-btn ec-btn-ghost">
              Arrêter la caméra
            </button>
          )}
        </div>
      </div>

      {/* Saisie manuelle */}
      <div className="ec-card">
        <h2 className="font-semibold mb-2">Saisie manuelle</h2>
        <p className="text-sm text-[var(--muted)] mb-3">
          Vous pouvez coller le contenu d&apos;un QR code Energy Coach.
        </p>
        <textarea
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          rows={2}
          placeholder="energycoach://connect-meter?type=linky&meterId=demo-linky-001"
          className="ec-input font-mono text-sm"
        />
        <button
          onClick={() => submit(manual)}
          disabled={status === "loading"}
          className="ec-btn ec-btn-primary mt-3"
        >
          {status === "loading" ? "Vérification…" : "Valider"}
        </button>
      </div>

      {/* QR codes de démonstration */}
      <div className="ec-card">
        <h2 className="font-semibold mb-1">QR codes de démonstration</h2>
        <p className="text-sm text-[var(--muted)] mb-4">
          Pour tester, scannez l&apos;un de ces QR codes ou cliquez pour simuler.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {demoQrs.map((q) => (
            <div key={q.payload} className="text-center">
              <div className="rounded-lg border border-[var(--border)] p-2 bg-white">
                <Image
                  src={q.image}
                  alt={q.name}
                  width={160}
                  height={160}
                  className="mx-auto h-auto w-full max-w-[160px]"
                />
              </div>
              <p className="mt-2 text-sm font-medium">{q.name}</p>
              <button
                onClick={() => submit(q.payload)}
                className="ec-btn ec-btn-ghost text-xs mt-1"
              >
                Simuler ce compteur
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
