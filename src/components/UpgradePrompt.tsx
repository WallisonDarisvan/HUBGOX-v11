import { Link } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';
import { Lock, ArrowRight } from 'lucide-react';

interface UpgradePromptProps {
  resource: string;
  limit: number;
  planName: string;
}

export function UpgradePrompt({ resource, limit, planName }: UpgradePromptProps) {
  return (
    <Alert className="border-amber-500/50 bg-amber-500/10">
      <Lock className="h-4 w-4 text-amber-500" />
      <AlertTitle>Limite atingido</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-3">
          Você atingiu o limite de <strong>{limit} {resource}</strong> do {planName}.
        </p>
        <Button asChild className="gradient-cyan">
          <Link to="/pricing">
            Fazer upgrade <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}