import { Doc } from 'feedbackfruits-knowledge-engine';
export declare function isTextDoc(doc: Doc): boolean;
export declare function isAboutDoc(doc: Doc): boolean;
export declare function isOperableDoc(doc: Doc): boolean;
export declare function buildQuery(uri: any, mapping?: {
    name: string;
    description: string;
    image: string;
}): string;
export declare function query(text: any, mapping?: {
    name: string;
    description: string;
    image: string;
}): any;
export declare function mapEntity(entity: any): {
    subject: string;
    predicate: string;
    object: string;
}[];
