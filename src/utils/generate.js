const fs = require('fs/promises');
const { join } = require('path');
const Handlebars = require('handlebars');

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

  const output = template({ options, language });
  // console.log(JSON.stringify(options, null, 2));
  // process.exit(0);

  await fs.writeFile(file, output, {
    encoding: 'utf-8'
  });
};
