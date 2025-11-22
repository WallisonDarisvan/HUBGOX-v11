import { LucideIcon } from 'lucide-react';

interface SocialIconProps {
  icon: LucideIcon;
  url: string;
  label: string;
}

export function SocialIcon({ icon: Icon, url, label }: SocialIconProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="transition-smooth hover:text-accent hover:scale-110"
    >
      <Icon className="w-6 h-6" />
    </a>
  );
}