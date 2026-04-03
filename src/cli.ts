#!/usr/bin/env node

import { Command } from "commander";

import { runConfigCommand } from "./commands/config.js";
import { runInstallCommand } from "./commands/install.js";
import { CliError } from "./errors.js";
import { t } from "./i18n.js";
import type { CliOptions } from "./types.js";
import { error } from "./ui/output.js";

function collectParameters(value: string, previous: string[] = []): string[] {
  previous.push(value);
  return previous;
}

async function main(): Promise<void> {
  const program = new Command();

  program
    .name("hf-to-ollama")
    .description(t("app.description"))
    .version("1.1.0");

  program
    .command("install")
    .description(t("cmd.install.description"))
    .option("--repo <repoId>", t("opt.repo"))
    .option("--file <path>", t("opt.file"))
    .option("--adapter <path>", t("opt.adapter"))
    .option("--parameter <key=value>", t("opt.parameter"), collectParameters, [])
    .option("--name <modelName>", t("opt.name"))
    .option("--dir <directory>", t("opt.dir"))
    .option("--token <token>", t("opt.token"))
    .option("--revision <revision>", t("opt.revision"))
    .option("--non-interactive", t("opt.non_interactive"))
    .option("--yes", t("opt.yes"))
    .option("--dry-run", t("opt.dry_run"))
    .action(async (options: CliOptions & { repo?: string }) => {
      await runInstallCommand(options);
    });

  program
    .command("config")
    .description(t("cmd.config.description"))
    .action(async () => {
      await runConfigCommand();
    });

  try {
    await program.parseAsync(process.argv);
  } catch (caught) {
    if (caught instanceof CliError) {
      error(caught.message);
      process.exit(caught.exitCode);
    }

    if (caught instanceof Error) {
      error(caught.message);
      process.exit(1);
    }

    error(t("error.unknown"));
    process.exit(1);
  }
}

void main();
