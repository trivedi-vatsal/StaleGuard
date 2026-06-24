import { WindowDots } from "./WindowDots";
import { CopyButton } from "./CopyButton";

export function CodeCard({ name, code }: { name: string; code: string }) {
  return (
    <div className="code-card">
      <div className="code-card-head">
        <WindowDots />
        <span className="code-card-name">{name}</span>
        <CopyButton text={code} />
      </div>
      <pre className="code-card-body">
        <code>{code}</code>
      </pre>
    </div>
  );
}
