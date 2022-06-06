const fs = require('fs/promises');
const { join } = require('path');
const { generate, generateSidebar } = require('./utils/generate');
const { getTags, getLanguages, filterApisByTag } = require('./utils/helper');

const DIR = join(__dirname, '../generated');

async function main() {
  // TODO: Read API Spec online
  const file = await fs.readFile('openapi.json', 'utf-8');
  const spec = JSON.parse(file);
  const languages = await getLanguages();
  const tags = getTags(spec.tags);
  // Generate Sidebar
  await generateSidebar({ languages, tags, paths: spec.paths });
  // Generate Docs
  for (const language of languages) {
    for (const tag of tags) {
      // Create directory
      // such as: generated/node/access-control-management/
      await fs.mkdir(join(DIR, language, tag.path), { recursive: true });
      const apis = filterApisByTag(spec.paths, tag.name);
      for (const [path, options] of apis) {
        await generate({
          language,
          path,
          options: Object.values(options)?.[0],
          tag,
          components: spec.components
        });
      }
    }
  }
}

main().catch((e) => console.error(e));
