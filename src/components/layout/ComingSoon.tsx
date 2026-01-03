/**
 * ComingSoon Component
 *
 * Placeholder page for tools that are not yet implemented
 * Provides a friendly message and maintains consistent UX
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ComingSoonProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export function ComingSoon({ title, description, icon }: ComingSoonProps) {
  return (
    <div className="container mx-auto py-12 px-4 lg:px-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          {icon && (
            <div className="mx-auto mb-4 text-muted-foreground">{icon}</div>
          )}
          <CardTitle className="text-3xl">{title}</CardTitle>
          <CardDescription className="text-base mt-2">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-muted text-muted-foreground">
            <span className="text-sm font-medium">Coming Soon</span>
          </div>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            This tool is currently under development. Check back later for
            updates!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
