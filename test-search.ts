import { searchRepoId } from "./src/ui/prompts.js";

async function run() {
  try {
    const selected = await searchRepoId();
    console.log("Selected:", selected);
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
