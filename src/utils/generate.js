const fs = require('fs/promises');
const { join } = require('path');
const Handlebars = require('handlebars');
const { getSchema } = require('./helper');

exports.generate = async ({ language, path, options, tag, components }) => {
  const template = Handlebars.compile(
    await fs.readFile(join(__dirname, 'template.hbs'), 'utf-8')
  );
  const file = join(
    __dirname,
    '../../generated',
    language,
    tag.path,
    `${path.replace(/^\/api\/v3\//, '')}.md`
  );

  const { requestBody, responses } = options;
  const schemaNameReq = requestBody?.content[
    'application/json'
  ].schema.$ref.replace(/^#\/components\/schemas\//, '');
  const schemaNameRes = responses['200'].content[
    'application/json'
  ].schema.$ref.replace(/^#\/components\/schemas\//, '');

  const output = template({
    options,
    language,
    ...(requestBody
      ? {
          request: {
            required: requestBody.required,
            name: schemaNameReq
          }
        }
      : {}),
    ...(responses
      ? { response: getSchema(schemaNameRes, components.schemas) }
      : {})
  });
  // console.log(JSON.stringify(options, null, 2));
  // process.exit(0);

  await fs.writeFile(file, output, {
    encoding: 'utf-8'
  });
};
