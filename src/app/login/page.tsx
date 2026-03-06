"use client";

import { signIn } from "next-auth/react";
import { Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <Github className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">GitPulse</CardTitle>
          <CardDescription>
            Sign in to track your GitHub contributions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => signIn("github", { callbackUrl: "/" })}
            className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
            size="lg"
          >
            <Github className="h-5 w-5" />
            Sign in with GitHub
          </Button>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            We only request read access to your public profile.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
