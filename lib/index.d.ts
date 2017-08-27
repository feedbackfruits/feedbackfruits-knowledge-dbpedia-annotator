import { Operation } from 'memux';
import { Doc } from 'feedbackfruits-knowledge-engine';
export declare type SendFn = (operation: Operation<Doc>) => Promise<void>;
export default function init({name}: {
    name: any;
}): Promise<void>;
