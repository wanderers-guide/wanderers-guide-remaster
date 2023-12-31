export type RequestType =
  | 'get-sheet-content'
  | 'upload-public-file'
  | 'open-ai-request'
  | 'find-content-source'
  | 'create-content-source'
  | 'delete-content'
  | 'find-trait'
  | 'create-trait'
  | 'create-ability-block'
  | 'find-ability-block'
  | 'create-ancestry'
  | 'find-ancestry'
  | 'create-background'
  | 'find-background'
  | 'create-class'
  | 'find-class'
  | 'create-item'
  | 'find-item'
  | 'create-language'
  | 'find-language'
  | 'create-creature'
  | 'find-creature'
  | 'create-spell'
  | 'find-spell'
  | 'create-character'
  | 'find-character'
  | 'update-character'
  | 'vector-db-populate-collection'
  | 'vector-db-query-collection';

// All requests follow JSend specification (https://github.com/omniti-labs/jsend) //
export type JSendResponse = JSendResponseSuccess | JSendResponseFail | JSendResponseError;
interface JSendResponseSuccess {
  status: 'success';
  data: NonNullable<any>;
}
interface JSendResponseFail {
  status: 'fail';
  data: NonNullable<any>;
}
interface JSendResponseError {
  status: 'error';
  message: string;
  data?: NonNullable<any>;
  code?: number;
}
