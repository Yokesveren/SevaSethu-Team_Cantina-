import { Construction } from "lucide-react";

interface ComingSoonProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export default function ComingSoon({ title, description, icon }: ComingSoonProps) {
  return (
    <div className="p-6">
      <div className="mb-5">
        <h1 className="font-display font-bold text-phc-text text-2xl leading-none">{title}</h1>
      </div>
      <div className="bg-phc-surface border border-phc-border rounded-lg px-8 py-14 flex flex-col items-center text-center max-w-lg mx-auto mt-12">
        <div className="w-14 h-14 rounded-full bg-phc-blue-light flex items-center justify-center mb-5">
          {icon || <Construction size={26} className="text-phc-blue" />}
        </div>
        <h2 className="font-display font-semibold text-phc-text text-lg mb-2">{title}</h2>
        <p className="text-phc-muted text-[13.5px] leading-relaxed">{description}</p>
        <div className="mt-6 text-[11.5px] font-mono text-phc-subtle bg-phc-bg border border-phc-border rounded px-3 py-1.5">
          Module under active development · SeVaSetu v2.5
        </div>
      </div>
    </div>
  );
}
