export default function BrandMark({ size = 56, withName = false, tagline = "atelier" }) {
  return (
    <div className="brand">
      <div className="brand-mark" style={{ width: size, height: size }}>
        <span className="glyph" style={{ fontSize: size * 0.66 }}>M</span>
      </div>
      {withName && (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span className="brand-name">Muse Iris</span>
          {tagline && <span className="brand-tag">{tagline}</span>}
        </div>
      )}
    </div>
  );
}
