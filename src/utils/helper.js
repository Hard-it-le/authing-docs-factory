const fs = require('fs/promises');
const path = require('path');

// Only uses get & post for now
const AVAILABLE_METHODS = ['get', 'post', 'put', 'delete', 'patch'];

exports.getLanguages = async () => {
  const files = await fs.readdir(path.join(__dirname, '../templates'));
  return files
    .filter((file) => file.endsWith('.js') && file !== 'index.js')
    .map((file) => file.replace(/\.js$/, ''));
};

exports.getTags = (tags) =>
  tags.map(({ name, description }) => ({
    name,
    description,
    path: `${name.replace(/\s/g, '-').toLowerCase()}`
  }));

exports.filterApisByTag = (paths, tag) =>
  Object.entries(paths).filter(([, options]) =>
    AVAILABLE_METHODS.some(
      (method) =>
        options?.[method]?.tags.includes(tag) &&
        !options?.[method]?.['x-authing-hidden-from-sdk']
    )
  );

exports.getSchemaName = (schema) =>
  schema?.$ref.replace(/^#\/components\/schemas\//, '');

exports.getSchema = (schemaName, schemas) => {
  const schema = schemas[schemaName];
  schema.name = schemaName;
  schema.required.forEach((key) => {
    schema.properties[key].required = true;
  });
  Object.keys(schema.properties).forEach((property) => {
    if (!schema.properties[property].allOf) {
      return;
    }
    schema.properties[property].schema = this.getSchemaName(
      schema.properties[property].allOf[0]
    );
  });
  schema.kv = Object.entries(schema.properties);
  return schema;
};
