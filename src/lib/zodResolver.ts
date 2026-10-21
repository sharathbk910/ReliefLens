import type { ZodType } from 'zod';
import { toNestErrors } from '@hookform/resolvers';
import type { Resolver } from 'react-hook-form';

/**
 * Universal Zod resolver compatible with both Zod v3 and Zod v4+
 * Prevents "Uncaught (in promise) ZodError" by safely capturing validation issues
 * and transforming them into React Hook Form error representations.
 */
export function zodSafeResolver<T extends Record<string, any>>(schema: ZodType<any, any, any>): Resolver<T> {
  return async (values, _context, options) => {
    try {
      const result = await (schema as any).safeParseAsync(values);
      if (result.success) {
        return { values: result.data, errors: {} };
      }

      const rawErrors: Record<string, any> = {};
      const issues = result.error.issues || (result.error as any).errors || [];

      for (const issue of issues) {
        const path = issue.path && issue.path.length > 0 ? issue.path.join('.') : 'root';
        if (!rawErrors[path]) {
          rawErrors[path] = {
            type: issue.code || 'validation',
            message: issue.message || 'Invalid value',
          };
        }
      }

      return {
        values: {},
        errors: toNestErrors(rawErrors as any, options),
      };
    } catch (err: any) {
      console.warn('Form validation resolution fallback:', err);
      return {
        values: {},
        errors: toNestErrors(
          {
            root: {
              type: 'validate',
              message: err?.message || 'Form validation failed',
            },
          } as any,
          options
        ),
      };
    }
  };
}
