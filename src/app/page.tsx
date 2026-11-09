import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">SyncBoard</h1>
      <p className="max-w-md text-muted-foreground">
        Collaborative Kanban boards that stay in sync for your whole team.
      </p>
      <Button size="lg">Get started</Button>
    </main>
  );
}
