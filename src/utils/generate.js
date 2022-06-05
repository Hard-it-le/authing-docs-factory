const fs = require('fs/promises');
const { join } = require('path');
const Handlebars = require('handlebars');
const {
  getSchema,
  getSchemaName,
  getSchemaModels,
  getExampleJson
} = require('./helper');

Handlebars.registerHelper('ifEquals', function (arg1, arg2, options) {
  return arg1 === arg2 ? options.fn(this) : options.inverse(this);
});

exports.generate = async ({ language, path, options, tag, components }) => {
  const template = Handlebars.compile(
    await fs.readFile(join(__dirname, 'template.hbs'), 'utf-8')
  );
  const templateCode = Handlebars.compile(
    await fs.readFile(
      join(__dirname, '../templates', `${language}.hbs`),
      'utf-8'
    )
  );
  const file = join(
    __dirname,
    '../../generated',
    language,
    tag.path,
    `${path.replace(/^\/api\/v3\//, '')}.md`
  );

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

  const exampleCode = templateCode({
    options,
    fnNameCamel: path
      .replace('/api/v3/', '')
      .replace(/-(.)/g, ($1) => $1.toUpperCase())
      .replace(/-/g, ''),
    fnNameSnake: path.replace('/api/v3/', '').replace(/-/g, '_'),
    ...(requestBody
      ? {
          request: getSchema(schemaNameReq, components.schemas)
        }
      : {}),
    schemas: components.schemas
  });
  const output = template({
    options,
    exampleCode,
    models,
    ...(requestBody
      ? {
          request: getSchema(schemaNameReq, components.schemas)
        }
      : {}),
    ...(responses
      ? {
          response: getSchema(schemaNameRes, components.schemas),
          responseJson: JSON.stringify(
            getExampleJson(schemaNameRes, components.schemas),
            null,
            2
          )
        }
      : {})
  });
  // console.log(JSON.stringify(options, null, 2));
  // process.exit(0);

  await fs.writeFile(file, output, {
    encoding: 'utf-8'
  });
};
