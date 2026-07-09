// Logo Energy Coach : 3 barres verticales de hauteurs croissantes dans un carré
// vert arrondi, reproduit en CSS pur.
export default function Logo({
  size = 34,
  withText = true,
  onDark = false,
}: {
  size?: number;
  withText?: boolean;
  onDark?: boolean;
}) {
  const pad = Math.round(size * 0.26);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 11 }}>
      <span
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 3,
          padding: pad,
          background: "#16513c",
          borderRadius: 11,
        }}
      >
        <span style={{ width: 4, height: size * 0.26, background: "#8fd0ae", borderRadius: 2 }} />
        <span style={{ width: 4, height: size * 0.41, background: "#bfe6d1", borderRadius: 2 }} />
        <span style={{ width: 4, height: size * 0.56, background: "#ffffff", borderRadius: 2 }} />
      </span>
      {withText && (
        <span
          style={{
            fontWeight: 800,
            fontSize: 19,
            letterSpacing: "-0.03em",
            color: onDark ? "#fff" : "var(--foreground)",
          }}
        >
          Energy Coach
        </span>
      )}
    </span>
  );
}
