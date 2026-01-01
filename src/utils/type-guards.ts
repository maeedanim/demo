import { IError } from '@/interfaces/error.interface';

export function isErrorResponse(obj: any): obj is IError {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.message === 'string' &&
    typeof obj.statusCode === 'number'
  );
}
