import { lookupLucideIcon } from "../lib/template-icons";

type Props = {
  icon: string | undefined | null;
  size?: number;
  className?: string;
};

/**
 * Renders a template icon. If `icon` is in the form `lucide:Name`, the
 * matching Lucide icon is drawn; otherwise the raw string (typically an
 * emoji) is rendered as text. Returns null when `icon` is empty.
 */
export function TemplateIcon({ icon, size = 16, className }: Props) {
  if (!icon) return null;
  const Lucide = lookupLucideIcon(icon);
  if (Lucide) {
    return <Lucide size={size} strokeWidth={1.75} className={className} />;
  }
  return <span className={className}>{icon}</span>;
}
