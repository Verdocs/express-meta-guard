import {app} from './index';
import {writeFileSync} from 'fs';
import {parseExpressApp} from 'express-route-parser';
import {IllegalInput, NotFound} from './docs/responses';
import {IParameter} from '../../src';
import {Book} from './docs/schemas';

const docs = {
  openapi: '3.0.2',
  info: {
    title: 'Express Meta Guard Example API',
    version: '1.0.2',
    description:
      'This is a sample Book Store project written in ExpressJS that uses Express Meta Guard and Express Route Parser to generate OpenAPI-format documentation.',
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  externalDocs: {
    description: 'Find out more about Express Meta Guard',
    url: 'https://github.com/Verdocs/express-meta-guard',
  },
  servers: [{url: '/'}],
  tags: [
    {
      name: 'Books',
      description: 'Entries related to books',
    },
  ],
  paths: {},
  components: {
    schemas: {
      Book,
    },
    responses: {
      IllegalInput,
      NotFound,
    },
  },
};

const parsed = parseExpressApp(app);
parsed.forEach(({path, method, metadata = {}}) => {
  const realPath = metadata?.path || path;
  docs.paths[path] = docs.paths[path] ?? {};

  const entry: any = {};

  // These keys are simply copied over as-is
  ['tags', 'summary', 'description', 'operationId'].forEach((directCopyKey) => {
    if (metadata?.[directCopyKey]) {
      entry[directCopyKey] = metadata[directCopyKey];
    }
  });

  // Parameters need a bit of reformatting for compatibility
  if (metadata?.parameters) {
    Object.entries(metadata?.parameters).forEach(([name, parameter]: [string, IParameter]) => {
      if (parameter.in === 'body') {
        entry.requestBody = entry.requestBody ?? {content: {'application/json': {schema: {type: 'object', properties: {}, required: []}}}};
        entry.requestBody.content['application/json'].schema.properties[name] = parameter.schema;
        if (parameter.required) {
          entry.requestBody.content['application/json'].schema.required.push(name);
        }
      } else {
        entry.parameters = entry.parameters ?? [];
        entry.parameters.push({
          name,
          in: parameter.in,
          required: parameter?.required || false,
          schema: parameter?.schema || {type: 'string'},
        });
      }
    });
  }

  if (metadata?.responses) {
    entry.responses = {...metadata?.responses};
    Object.keys(entry.responses).forEach((code) => {
      if (typeof entry.responses[code] === 'string') {
        let $ref = entry.responses[code];

        // Rewrite array-type shorthand references
        const schema = $ref.includes('[]') ? {type: 'array', items: {$ref: $ref.replace('[]', '')}} : {$ref};

        entry.responses[code] = {
          description: 'Success',
          content: {
            'application/json': {schema},
          },
        };
      }
    });
  } else {
    // Per the spec, responses is required
    entry.responses = {
      '200': {
        description: 'Success',
      },
    };
  }

  docs.paths[realPath][method] = entry;
});

writeFileSync('swagger.json', JSON.stringify(docs, null, 2));
