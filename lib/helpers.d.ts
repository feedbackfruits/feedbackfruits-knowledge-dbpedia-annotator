import { Doc } from 'feedbackfruits-knowledge-engine';
export declare function isTextDoc(doc: Doc): boolean;
export declare function isAboutDoc(doc: Doc): boolean;
export declare function isOperableDoc(doc: Doc): boolean;
export declare function buildQuery(uri: any, mapping?: {
    name: any;
    description: any;
    image: any;
}): string;
export declare function query(text: any, mapping?: {
    name: any;
    description: any;
    image: any;
}): any;
export declare function mapEntity(entity: any): {
    subject: string;
    predicate: any;
    object: any;
}[];
