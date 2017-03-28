require('dotenv').load({ silent: true });

const {
  NAME = 'feedbackfruits-knowledge-dbpedia-annotator-v5',
  KAFKA_ADDRESS = 'tcp://kafka:9092',
  INPUT_TOPIC = 'quad_updates',
  OUTPUT_TOPIC = 'quad_update_requests',
  DBPEDIA_SPARQL_ENDPOINT = 'http://dbpedia.org/sparql'
} = process.env;

const qs = require('qs');
const memux = require('memux');
const PQueue = require('p-queue');
const fetch = require('node-fetch');

const { source, sink, send } = memux({
  name: NAME,
  url: KAFKA_ADDRESS,
  input: INPUT_TOPIC,
  output: OUTPUT_TOPIC
});

const queue = new PQueue({
  concurrency: 32
});

const context = {
  type: '<http://www.w3.org/1999/02/22-rdf-syntax-ns#type>',
  name: '<http://schema.org/name>',
  image: '<http://schema.org/image>',
  description: '<http://schema.org/description>',

  label: 'http://www.w3.org/2000/01/rdf-schema#label',
  abstract: 'http://dbpedia.org/ontology/abstract',
  thumbnail: 'http://xmlns.com/foaf/0.1/depiction',
  redirects: 'http://dbpedia.org/ontology/wikiPageRedirects',

  Entity: '<https://knowledge.express/Entity>',
};

const DEFAULT_MAPPING = {
  name: context.label,
  description: context.abstract,
  image: context.thumbnail
};

function buildQuery(uri, mapping = DEFAULT_MAPPING) {
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
        ?alt_id <${context.redirects}> ?uri .
        ${where}
      }
      FILTER(${filter})
    }
  `;

  return query;
}

function query(text, mapping = DEFAULT_MAPPING) {
  const url = `${DBPEDIA_SPARQL_ENDPOINT}?${qs.stringify({ query: text, output: 'json' })}`;
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

function mapEntity(entity) {
  let { uri, name, description, image } = entity;
  let subject = `<${uri}>`;
  let quads = [
    { subject, predicate: context.type, object: context.Entity },
  ];

  if (name != null) quads.push({ subject, predicate: context.name, object: name });
  if (description != null) quads.push({ subject, predicate: context.description, object: description });
  if (image != null) quads.push({ subject, predicate: context.image, object: image });

  return quads;
}

const regex = /^<(http:\/\/dbpedia\.org\/resource\/\w+)>$/;
const done = {};

source.flatMap(({ action: { type, quad: { subject, object } }, progress }) => {
  return queue.add(() => {
    const subjectMatch = subject.match(regex);
    const objectMatch = object.match(regex);

    const url = subjectMatch ? subjectMatch[1] : (objectMatch ? objectMatch[1] : null);

    if (!url) return Promise.resolve();
    if (url in done) return Promise.resolve();

    done[url] = true;

    return query(buildQuery(url)).then(res => {
      let quads = mapEntity(res).map(quad => ({ type: 'write', quad }));
      debugger;
      return Promise.all(quads.map(send));
    }).catch(err => { console.error(err); throw err; });

  }).then(() => progress)
}).subscribe(sink);
