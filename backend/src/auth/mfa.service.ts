import { HttpStatus, Injectable } from '@nestjs/common';
import { generateSecret, generateURI, verify } from 'otplib';
import { ApplicationException } from '../common/exceptions/application.exception';
import { ErrorCode } from '../common/exceptions/error-code';
import { UnitOfWorkService } from '../persistence/unit-of-work/unit-of-work.service';
import { PrismaService } from '../prisma.service';

@Injectable()
export class MfaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
  ) {}

  async startEnroll(userId: bigint) {
    const user = await this.prisma.client.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) {
      throw new ApplicationException(
        ErrorCode.USER_NOT_FOUND,
        'User not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const secret = generateSecret();
    const now = BigInt(Date.now());
    await this.unitOfWork.run(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          totpSecret: secret,
          totpEnabled: false,
          updatedAt: now,
          version: { increment: 1 },
        },
      });
    });

    return {
      secret,
      otpauthUrl: generateURI({
        issuer: 'PharmacyERP',
        label: user.username,
        secret,
      }),
    };
  }

  async confirmEnroll(userId: bigint, token: string) {
    const user = await this.prisma.client.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user?.totpSecret) {
      throw new ApplicationException(
        ErrorCode.BAD_REQUEST,
        'MFA enrollment not started',
        HttpStatus.BAD_REQUEST,
      );
    }

    const valid = await verify({ token, secret: user.totpSecret });
    if (!valid) {
      throw new ApplicationException(
        ErrorCode.AUTH_INVALID_CREDENTIALS,
        'Invalid verification code',
        HttpStatus.BAD_REQUEST,
      );
    }

    const now = BigInt(Date.now());
    await this.unitOfWork.run(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          totpEnabled: true,
          updatedAt: now,
          version: { increment: 1 },
        },
      });
    });

    return { enrolled: true };
  }
}
