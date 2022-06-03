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
  (schema?.required || []).forEach((key) => {
    schema.properties[key].required = true;
  });
  Object.keys(schema.properties).forEach((property) => {
    if (Array.isArray(schema.properties[property].example)) {
      schema.properties[property].example = JSON.stringify(
        schema.properties[property].example
      );
    }
    if (schema.properties[property].allOf) {
      schema.properties[property].schema = this.getSchemaName(
        schema.properties[property].allOf[0]
      );
    }
  });
  return schema;
};

exports.getSchemaModels = (schemaName, schemas) => {
  if (!schemaName) {
    return [];
  }
  const result = [];
  const schema = schemas[schemaName];
  Object.keys(schema.properties).forEach((property) => {
    if (schema.properties[property].allOf) {
      const childSchemaName = this.getSchemaName(
        schema.properties[property].allOf[0]
      );
      result.push(childSchemaName);
      // getChildrenModels
      const childModels = this.getSchemaModels(childSchemaName, schemas);
      result.push(...childModels);
    }
  });
  return Array.from(new Set(result));
};
