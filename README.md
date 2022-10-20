<div align="center">

# Express Meta Guard

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Contribute with Gitpod](https://img.shields.io/badge/Contribute%20with-Gitpod-908a85?logo=gitpod)](https://gitpod.io/#https://github.com/verdocs/express-meta-guard)

</div>

## Overview

Express is the most popular NodeJS framework for building APIs with good reason: it combines high performance,
easy of use, and a large number of third-party contrib modules to create an ecosystem that makes it easy to
quickly build sophisticated, high-performance APIs.

Unfortunately, its imperative style of declaring routes and handlers can make it more challenging to document
those same APIs. Where some frameworks allow developers to specify metadata alongside API call handlers, Express
has no built-in mechanism to support this. Although there have been some
[great](https://medium.com/swlh/automatic-api-documentation-in-node-js-using-swagger-dd1ab3c78284)
[solutions](https://blog.logrocket.com/documenting-your-express-api-with-swagger/)
[shared](https://github.com/mpashkovskiy/express-oas-generator) by the community to provide Swagger/OpenAPI
documentation from Express APIs, they all have one or more compromises to be made:

1. Generators that use documentation blocks create messy routing files. OpenAPI is a very verbose spec, and
   documentation blocks can sometimes be 3-4x the length of the handler code.
1. Documentation blocks also offer no "code assistance" to the developer. It is very easy to make even simple
   typo-level mistakes that break your documentation, and developers must memorize all of the available options
   to specify.
1. Generators that scan or observe the code itself are not sophisticated enough to capture all of the critical
   details from a modern code base, especially TypeScript interfaces and types, response models, and middleware
   processors guards.
1. All of the current solutions fail to combine _documentation_ with _enforcement_. It is too easy to make simple
   mistakes such as marking an input field as required but not fully enforcing it in the code itself. This can
   lead to bugs, security vulnerabilities, and other unexpected behavior.
1. It is still up to developers to implement repetitive, "common sense" handlers, e.g. converting path and query
   parameters from strings to integers, and sanitizing data for database operations.

## Features

Express Meta Guard takes a new approach to these options, making it easier to document ExpressJS APIs while also
enforcing the rules that the documentation specifies.

This module is an ExpressJS middleware/guard that provides input validation and documentation at the same
time. It allows metadata such as operation names, inputs, and responses to be specified inline with route definitions,
making them easy for developers to maintain as routes are created/enhanced. But unlike documentation-only methods,
those definitions are also enforced. If a field is required or must be of a certain type or format, those rules
are checked before the handler is called.

```typescript
app.get(
  '/books',
  MetaGuard({
    name: 'getBooks',
    description: 'Get a paginated list of all available books.',
    parameters: {
      page: {in: 'query', required: true, formatter: (val: any) => +val},
      count: {in: 'query', default: 10, formatter: (val: any) => +val},
    },
    tags: ['Books'],
  }),
  booksController.getBooks,
);
```

Then, via [Express Route Parser](https://github.com/nklisch/express-route-parser), this module can generate
OpenAPI compatible documentation for an API. If you provide a folder of models, you can even reference those
models in your documentation, which is particularly useful for return types! See below for information on
how to do this.

## Installation

Simply install this package in your project as a devDependency. Via NPM:

```bash
npm i -D express-route-parser
```

or Yarn:

```bash
yarn add -D express-route-parser
```

## Usage

Usage is simple. When defining a route, simply add MetaGuard as a middleware. Most common OpenAPI flags are
available, and have the same names:

```typescript
import {MetaGuard} from 'express-meta-guard';

app.get(
  '/books',
  MetaGuard({
    name: 'getBooks',
    description: 'Get a paginated list of all available books.',
  }),
  booksController.getBooks,
);
```

Inputs may be formatted, which is especially useful for path and query params that always arrive as strings.
Formatters receive (value, req) as parameters:

```typescript
import {MetaGuard} from 'express-meta-guard';

app.get(
  '/books',
  MetaGuard({
    name: 'getBooks',
    parameters: {
      page: {in: 'query', formatter: (val: any) => +val},
      showReserved: {in: 'query', formatter: (val: any) => val === 'true'},
    },
  }),
  booksController.getBooks,
);
```

For your convenience, you will almost always want to have MetaGuard pass along the final list of post-processed
parameters. You can do this with the `annotateLocals` option, which should be a string key that will be set on
`res.locals`:

```typescript
import {MetaGuard} from 'express-meta-guard';

app.get(
  '/books',
  MetaGuard({
	annotateLocals: 'inputs',
    name: 'getBooks',
    parameters: {
      page: {in: 'query', formatter: (val: any) => +val},
    },
  }),
  (req, res, next) => {
    console.log(res.locals.inputs.page); // <== Will be the "page" query parameter
	next();
  },
);
```

Inputs may also be validated. Validators may be asynchronous, allowing them to perform cache (session) or
database lookups. To report an error, validators may throw an exception, return a string error message, or
return false.

Validators receive (value, req) as parameters, so they may check dependent variables.

```typescript
import {MetaGuard} from 'express-meta-guard';

app.get(
  '/books',
  MetaGuard({
    name: 'getBooks',
    parameters: {
      companyId: {
        in: 'path',
        validator: async (companyId: string) => {
          const company = await Company.findOne({where: {id: companyId}});
          if (!company) {
            throw new Error('Invalid company ID');
          }
        },
      },
      companyType: {
        in: 'path',
        validator: (companyType: string) =>
          ['public', 'private'].includes(companyType) || 'companyType must be one of "public" or "private"',
      },
      showPublicFilings: {
        in: 'query',
        formatter: (val: any) => val === 'true',
        validator: (val: boolean) => req.query.companyType === 'public',
      },
    },
  }),
  booksController.getBooks,
);
```

Note that validators run after formatters, so they should check the expected types, not the source types. Also, 
they do not have access to the final, annotated list of inputs even if `annotateLocals` is set. This is because
this module will terminate early if any violation is detected, avoiding unnecessary work in later validators.

Naturally, most projects will refactor commonly-used operators into reusable functions to keep the code clean
and easy to scan/maintain:

```typescript
import {MetaGuard} from 'express-meta-guard';
import {companyExists, companyTypeIsValid, stringToBool, companyTypePublic} from '../lib/inputHandlers';

app.get(
  '/books',
  MetaGuard({
    name: 'getBooks',
    parameters: {
      companyId: { in: 'path', validator: companyExists },
      companyType: { in: 'path', validator: companyTypeIsValid },
      showPublicFilings: { in: 'query', formatter: stringToBool, validator: companyTypePublic },
    },
  }),
  booksController.getBooks,
);
```

## OpenAPI / Swagger

Most OpenAPI parameters are available to be set, all of which are optional:

```typescript
import {MetaGuard} from 'express-meta-guard';

app.get(
  '/books',
  MetaGuard({
    // The human-friendly operation name
    name: 'getBooks',
    // Explicitly specify the endpoint's path, see below 
    path: '/books',
    // OpenAPI summary, description, and tags fields 
    summary: 'Get books.',
    description: 'Get a paginated list of all available books.',
    tags: ['Books'],

    // If set to true, the endpoint will not be included in the generated OpenAPI documentation
    hidden: false,

    // List of accepted input parameters. Most OpenAPI options apply
    parameters: {},

    // If "output" is set to a simple object, will be used to generate a standard OpenAPI "object" schema with
    // properties specified inline. This is simple, but not very accurate. If set to a string, will be emitted
    // in the documentation as a reference, e.g. '#/components/schemas/Book'.
    output: any;
  }),
  booksController.getBooks,
);
```

Note that when generating OpenAPI documentation via `express-route-parser`, the `path` parameter can normally be
automatically determined. However, ExpressJS supports complex routes with aliases, RegEx matching, and other
options that don't cleanly map to OpenAPI specifications. If you see odd paths emitted like 
`'/(?:^\\/templates\\/?(?=\\/|$)|^\\/documents\\/?(?=\\/|$))/i/list'`, you can provide the `path` property to
explicitly set the path that will be shown in the documentation.

Some OpenAPI schema properties can be also used to simplify formatting and validation operations. Here, page will
be both formatted and validated as an integer:

```typescript
import {MetaGuard} from 'express-meta-guard';

app.get(
  '/books',
  MetaGuard({
    name: 'getBooks',
    parameters: {
      page: {in: 'query', schema: {type: 'integer'}},
    },
  }),
  booksController.getBooks,
);
```

Bear in mind that in Javascript, not all OpenAPI types have as much meaning. For example, all floats
are 64-bit in JS, so there is no differentiation between 'float' and 'double'. Currently, only `string`,
`integer`, `number`, and `boolean` will be enforced.

Currently the supported schema-based conversions and validations are:
- Converting to string, integer, number, and boolean
- For integers and numbers, checking that the input was a valid number
- For booleans, supporting string values of `1`, `True`, `TRUE`, and boolean `true` as inputs
- For integers and numbers, the `minimum` and `maximum` value properties
- For strings, the `minLength` and `maxLength` properties
- For integers, numbers, and strings, the `enum` property 

## Generating Documentation

