import { Operation } from 'memux';
import { Annotator, Doc, Helpers, Config as _Config } from 'feedbackfruits-knowledge-engine';
import * as Context from 'feedbackfruits-knowledge-context';
import * as Config from './config';
import { isOperableDoc, query, buildQuery, mapEntity } from './helpers';

// const regex = /^<(http:\/\/dbpedia\.org\/resource\/\w+)>$/;
// const done = {};


export type SendFn = (operation: Operation<Doc>) => Promise<void>;

export default async function init({ name }) {
  const receive = (send: SendFn) => async (operation: Operation<Doc>) => {
    console.log('Received operation:', operation);
    const { action, data: doc } = operation;
    if (!(action === 'write') || !isOperableDoc(doc)) return;

    const annotatedDocs = await annotate(doc);
    return Promise.all(annotatedDocs.map(annotatedDoc => ({ action: 'write', key: annotatedDoc['@id'], data: annotatedDoc })).map(send))
      .then(() => {});
  }

  return await Annotator({
    name,
    receive,
    customConfig: Config as any as typeof _Config.Base
  });

}

async function annotate(doc: Doc): Promise<Doc[]> {
  console.log('Annotating doc:', doc);
  // const captions = await getCaptionsForLanguage(doc['@id'], 'en');
  // // console.log('Got captions:', captions);
  // if (captions === '') return doc;
  // console.log(`Setting ${Helpers.decodeIRI(Context.text)} to captions`);

  const entities: string[] = doc[Helpers.decodeIRI(Context.about)]
  const docss = await Promise.all(entities.map(async entity => {
    const quads = mapEntity(await query(buildQuery(Helpers.decodeIRI(entity))));
    return Helpers.quadsToDocs(quads);
  }));
  
  return docss.reduce((memo, docs) => memo.concat(docs), []);
}

// Start the server when executed directly
declare const require: any;
if (require.main === module) {
  console.log("Running as script.");
  init({
    name: Config.NAME,
  }).catch(console.error);
}


// source.flatMap(({ action: { type, quad: { subject, object } }, progress }) => {
//   return queue.add(() => {
//     const subjectMatch = subject.match(regex);
//     const objectMatch = object.match(regex);
//
//     const url = subjectMatch ? subjectMatch[1] : (objectMatch ? objectMatch[1] : null);
//
//     if (!url) return Promise.resolve();
//     if (url in done) return Promise.resolve();
//
//     done[url] = true;
//
//     return query(buildQuery(url)).then(res => {
//       let quads = mapEntity(res).map(quad => ({ type: 'write', quad }));
//       debugger;
//       return Promise.all(quads.map(send));
//     }).catch(err => { console.error(err); throw err; });
//
//   }).then(() => progress)
// }).subscribe(sink);
