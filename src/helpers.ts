import fetch from 'node-fetch';
import { Doc, Helpers } from 'feedbackfruits-knowledge-engine';
import * as Context from 'feedbackfruits-knowledge-context';
import * as Config from './config';

const qs = require('qs');

export function isTextDoc(doc: Doc) {
  return (Helpers.decodeIRI(Context.text) in doc);
}

export function isAboutDoc(doc: Doc) {
  return (Helpers.decodeIRI(Context.about) in doc);
}

export function isOperableDoc(doc: Doc): boolean {
  return isAboutDoc(doc);
}

const DEFAULT_MAPPING = {
  name: Context.DBPedia.label,
  description: Context.DBPedia.abstract,
  image: Context.DBPedia.thumbnail
};

export function buildQuery(uri, mapping = DEFAULT_MAPPING) {
  const what = Object.keys(mapping).map(key => `?${key}`).join(' ') + ' ?uri';
  const where = Object.keys(mapping).map(key => `OPTIONAL { ?uri <${mapping[key]}> ?${key} . }`).join("\n");
  const filter = Object.keys(mapping).map(key => `(!isLiteral(?${key}) || lang(?${key}) = 'en')`).join(" && ");

  const query = `
    SELECT DISTINCT ${what} WHERE {
      {
        values ?uri { <${uri}> }
        ${where}
      } UNION {
        values ?alt_id { <${uri}> }
        ?alt_id <${Context.DBPedia.redirects}> ?uri .
        ${where}
      }
      FILTER(${filter})
    }
  `;

  return query;
}

export function query(text, mapping = DEFAULT_MAPPING) {
  const url = `${Config.DBPEDIA_SPARQL_ENDPOINT}?${qs.stringify({ query: text, output: 'json' })}`;
  console.log(`Fetching DBPedia entity:`, text);
  return fetch(url)
    .then(response => response.text().then(resText => {
      try {
        return JSON.parse(resText);
      } catch(err) {
        console.log(`Error fetching entity:`, text, err, resText);
        throw err;
      }
    }))
    .then(result => parseResult(result, mapping));
}

function parseResult(result, mapping) {
  let { bindings } = result.results;
  if (!bindings.length) throw Error(`Could not find entity`);
  let binding = bindings.length === 1 ? bindings[0] : bindings.reduce((memo, binding) => {
    if (!memo) return binding;
    if (Object.keys(binding).length > Object.keys(memo).length) return binding;
    return memo;
  }, null);

  let keys = Object.keys(mapping).concat('uri');
  return keys.reduce((memo, key) => {
    if (!(key in binding)) return memo;
    return Object.assign({}, memo, { [key]:  binding[key].value });
  }, {});
}

export function mapEntity(entity) {
  let { uri, name, description, image } = entity;
  let subject = `<${uri}>`;
  let quads = [
    { subject, predicate: Context.type, object: Context.Knowledge.Entity },
  ];

  if (name != null) quads.push({ subject, predicate: Context.name, object: name });
  if (description != null) quads.push({ subject, predicate: Context.description, object: description });
  if (image != null) quads.push({ subject, predicate: Context.image, object: image });

  return quads;
}
