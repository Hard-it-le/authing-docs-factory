const fs = require('fs/promises');
const path = require('path');

// Only uses get & post for now
const AVAILABLE_METHODS = ['get', 'post', 'put', 'delete', 'patch'];

exports.getLanguages = async () => {
  const files = await fs.readdir(path.join(__dirname, '../templates/sdk'));
  return files
    .filter((file) => file.endsWith('.ejs'))
    .map((file) => file.replace(/\.ejs$/, ''));
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
  if (!schemaName) return;
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
    } else if (schema.properties[property].items) {
      if (schema.properties[property].items.$ref) {
        schema.properties[property].schema = this.getSchemaName(
          schema.properties[property].items
        );
      }
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
  Object.entries(schema.properties).forEach(([, opts]) => {
    if (opts.allOf || (opts.items && opts.items.$ref)) {
      const childSchemaName = opts.allOf
        ? this.getSchemaName(opts.allOf[0])
        : this.getSchemaName(opts.items);
      result.push(childSchemaName);
      // getChildrenModels
      const childModels = this.getSchemaModels(childSchemaName, schemas);
      result.push(...childModels);
    }
  });
  return Array.from(new Set(result));
};

exports.getExampleJson = (schemaName, schemas) => {
  const result = {};
  const schema = schemas[schemaName];
  Object.entries(schema.properties).forEach(([property, opts]) => {
    if (opts.allOf) {
      result[property] = this.getExampleJson(
        this.getSchemaName(schema.properties[property].allOf[0]),
        schemas
      );
    }
    if (opts.items && opts.items.$ref) {
      result[property] = this.getExampleJson(
        this.getSchemaName(schema.properties[property].items),
        schemas
      );
    }
    if (opts.example || opts.default) {
      result[property] = opts.example || opts.default;
    }
  });
  return result;
};
