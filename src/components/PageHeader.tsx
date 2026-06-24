export function PageHeader({
  eyebrow,
  heading,
  lede,
}: {
  eyebrow: string;
  heading: string;
  lede: string;
}) {
  return (
    <div className="section-head">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{heading}</h1>
      <p className="lede">{lede}</p>
    </div>
  );
}
