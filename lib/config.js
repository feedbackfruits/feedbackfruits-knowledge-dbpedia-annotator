"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
const { NAME = 'feedbackfruits-knowledge-dbpedia-annotator', KAFKA_ADDRESS = 'tcp://localhost:9092', INPUT_TOPIC = 'staging_updates', OUTPUT_TOPIC = 'staging_update_requests', DBPEDIA_SPARQL_ENDPOINT = 'http://dbpedia.org/sparql' } = process.env;
exports.NAME = NAME;
exports.KAFKA_ADDRESS = KAFKA_ADDRESS;
exports.INPUT_TOPIC = INPUT_TOPIC;
exports.OUTPUT_TOPIC = OUTPUT_TOPIC;
exports.DBPEDIA_SPARQL_ENDPOINT = DBPEDIA_SPARQL_ENDPOINT;
