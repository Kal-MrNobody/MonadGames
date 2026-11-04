import type { GameTemplate } from "@/lib/types";
import { flappyTemplate } from "./templates/flappy";
import { tapTemplate } from "./templates/tap";
import { snakeTemplate } from "./templates/snake";
import { runnerTemplate } from "./templates/runner";
import { racerTemplate } from "./templates/racer";
import { shooterTemplate } from "./templates/shooter";
import { memoryTemplate } from "./templates/memory";
import { puzzleTemplate } from "./templates/puzzle";
import { wordTemplate } from "./templates/word";
import { catcherTemplate } from "./templates/catcher";

export const templates: GameTemplate[] = [
  flappyTemplate,
  tapTemplate,
  snakeTemplate,
  runnerTemplate,
  racerTemplate,
  shooterTemplate,
  memoryTemplate,
  puzzleTemplate,
  wordTemplate,
  catcherTemplate,
];

export function getTemplate(id: string): GameTemplate | undefined {
  return templates.find((t) => t.id === id);
}

export type TemplateSummary = Omit<GameTemplate, "html">;

export function listTemplates(): TemplateSummary[] {
  return templates.map(({ html: _html, ...rest }) => rest);
}
