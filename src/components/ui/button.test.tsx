import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { Button } from "@/components/ui/button";

it("renders a button that responds to clicks", () => {
  const onClick = vi.fn();
  render(<Button onClick={onClick}>Create board</Button>);
  screen.getByRole("button", { name: "Create board" }).click();
  expect(onClick).toHaveBeenCalledOnce();
});
