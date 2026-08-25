import { RequestContextService } from '../../persistence/context/request-context.service';
import { AppLogger } from './app-logger.service';

describe('AppLogger', () => {
  let logger: AppLogger;
  let winstonLog: jest.Mock;
  let requestContext: RequestContextService;

  beforeEach(() => {
    winstonLog = jest.fn();
    requestContext = new RequestContextService();
    logger = new AppLogger({ log: winstonLog } as never, requestContext);
  });

  it('injects request context into structured logs', async () => {
    await requestContext.run(
      {
        companyId: 1n,
        branchId: 2n,
        userId: 10n,
        deviceId: 'device-1',
        correlationId: 'corr-abc',
      },
      async () => {
        logger.info({ saleId: 5n }, 'Sale posted');
        await Promise.resolve();
      },
    );

    expect(winstonLog).toHaveBeenCalledWith(
      'info',
      expect.objectContaining({
        companyId: '1',
        branchId: '2',
        userId: '10',
        deviceId: 'device-1',
        correlationId: 'corr-abc',
        saleId: '5',
        message: 'Sale posted',
      }),
    );
  });

  it('logs string messages with context name', () => {
    logger.log('hello', 'TestContext');

    expect(winstonLog).toHaveBeenCalledWith(
      'info',
      expect.objectContaining({
        message: 'hello',
        context: 'TestContext',
      }),
    );
  });
});
