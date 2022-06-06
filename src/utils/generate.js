const ejs = require('ejs');
const fs = require('fs/promises');
const { join } = require('path');
const { filterApisByTag } = require('./helper');
const {
  getSchema,
  getSchemaName,
  getSchemaModels,
  getExampleJson
} = require('./helper');

const DIR = join(__dirname, '../../generated');

exports.generate = async ({ language, path, options, tag, components }) => {
  const { requestBody, responses } = options;
  const schemaNameReq = getSchemaName(
    requestBody?.content['application/json'].schema
  );
  const schemaNameRes = getSchemaName(
    responses['200'].content['application/json'].schema
  );
  const models = [
    ...getSchemaModels(schemaNameReq, components.schemas),
    ...getSchemaModels(schemaNameRes, components.schemas)
  ].map((name) => getSchema(name, components.schemas));
  const output = await ejs.renderFile(
    join(__dirname, '../templates/main.ejs'),
    {
      language,
      path,
      options,
      tag,
      components,
      models,
      fnNameCamel: path
        .replace('/api/v3/', '')
        .replace(/-(.)/g, ($1) => $1.toUpperCase())
        .replace(/-/g, ''),
      fnNameSnake: path.replace('/api/v3/', '').replace(/-/g, '_'),
      request: getSchema(schemaNameReq, components.schemas),
      response: getSchema(schemaNameRes, components.schemas),
      responseJson: JSON.stringify(
        getExampleJson(schemaNameRes, components.schemas),
        null,
        2
      )
    },
    {
      // async: true
    }
  );
  const file = join(
    DIR,
    language,
    tag.path,
    `${path.replace(/^\/api\/v3\//, '')}.md`
  );
  await fs.writeFile(file, output, {
    encoding: 'utf-8'
  });
};

exports.generateSidebar = async ({ languages, tags, paths }) => {
  await fs.rm(DIR, {
    recursive: true,
    force: true
  });
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
      const apis = filterApisByTag(paths, tag.name);
      for (const [path] of apis) {
        subCategory.children.push(
          `${subCategory.path}${path.replace(/^\/api\/v3\//, '')}`
        );
      }
      if (subCategory.children.length > 0) {
        sidebar[category].children.push(subCategory);
      }
    }
  }
  await fs.writeFile(
    join(DIR, 'sidebar.json'),
    JSON.stringify(sidebar, null, 2),
    { encoding: 'utf-8' }
  );
};
