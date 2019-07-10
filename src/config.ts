require('dotenv').config();

const {
  NAME = 'feedbackfruits-knowledge-dbpedia-annotator',
  KAFKA_ADDRESS = 'tcp://localhost:9092',
  INPUT_TOPIC = 'staging_updates',
  OUTPUT_TOPIC = 'staging_update_requests',
  DBPEDIA_SPARQL_ENDPOINT = 'http://dbpedia.org/sparql'
} = process.env;

export {
  NAME,
  KAFKA_ADDRESS,
  INPUT_TOPIC,
  OUTPUT_TOPIC,
  DBPEDIA_SPARQL_ENDPOINT,
}
