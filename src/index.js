const fs = require('fs/promises');
const { join } = require('path');
const { generate } = require('./utils/generate');
const { getTags, getLanguages, filterApisByTag } = require('./utils/helper');

const DIR = join(__dirname, '../generated');

async function main() {
  // TODO: Read API Spec online
  const file = await fs.readFile('openapi.json', 'utf-8');
  const spec = JSON.parse(file);

  await fs.rm(DIR, {
    recursive: true,
    force: true
  });
  const languages = await getLanguages();
  const tags = getTags(spec.tags);
  // Generate Sidebar
  await fs.mkdir(DIR, { recursive: true });
  const sidebar = {};
  for (const language of languages) {
    const category = `/reference-new/sdk/${language}/`;
    sidebar[category] = {
      title: language.replace(/^(.)/, (_, $1) => $1.toUpperCase()),
      collapsable: false,
      children: []
    };
    for (const tag of tags) {
      const subCategory = {
        title: tag.name,
        path: `${category}${tag.path}/`,
        children: []
      };
      const apis = filterApisByTag(spec.paths, tag.name);
      for (const [path] of apis) {
        subCategory.children.push(
          `${subCategory.path}${path.replace(/^\/api\/v3\//, '')}`
        );
      }
      sidebar[category].children.push(subCategory);
    }
  }
  await fs.writeFile(
    join(DIR, 'sidebar.json'),
    JSON.stringify(sidebar, null, 2),
    { encoding: 'utf-8' }
  );
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
