import { ApiClientError, ApiSuccessResponse } from '../models/api-response.types';
import { unwrapApiResponse } from './api.service';

describe('unwrapApiResponse', () => {
  it('unwraps successful envelope', () => {
    const response: ApiSuccessResponse<{ id: string }> = {
      success: true,
      data: { id: '1' },
    };

    expect(unwrapApiResponse(response)).toEqual({ id: '1' });
  });

  it('throws ApiClientError for error envelope', () => {
    const response = {
      success: false as const,
      error: {
        code: 'NOT_FOUND',
        message: 'Missing',
        details: null,
      },
    };

    expect(() => unwrapApiResponse(response)).toThrow(ApiClientError);
    try {
      unwrapApiResponse(response);
    } catch (error) {
      expect(error).toMatchObject({
        code: 'NOT_FOUND',
        message: 'Missing',
      });
    }
  });
});
