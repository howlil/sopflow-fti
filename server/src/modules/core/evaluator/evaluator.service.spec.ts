import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ServiceUnavailableException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  BCRYPT_SALT_ROUNDS,
  DEFAULT_PENGGUNA_PASSWORD,
} from '../../../common/auth/password.constants';
import { PlatformRole, Prisma, PeranPengguna, type Pengguna } from '../../../generated/prisma';
import { PenggunaRepository } from '../pengguna/pengguna.repository';
import { EvaluatorService } from './evaluator.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-default-password'),
}));

describe('Pengujian EvaluatorService', () => {
  let service: EvaluatorService;
  let repository: jest.Mocked<
    Pick<
      PenggunaRepository,
      | 'findPjEvaluatorOrganisasiOpdId'
      | 'findPjEvaluatorOrganisasiOpd'
      | 'findEvaluatorsByOpd'
      | 'findEvaluatorByIdInOpd'
      | 'findEvaluatorAktifById'
      | 'createPengguna'
      | 'updateEvaluator'
      | 'softDeleteEvaluator'
      | 'existsEmailOtherThan'
      | 'existsNipOtherThan'
    >
  >;

  const baseRow: Pengguna = {
    penggunaId: 'u-1',
    email: 'a@b.c',
    opdId: 'opd-biro',
    nama: 'Test',
    kataSandi: 'x',
    peran: PeranPengguna.EVALUATOR,
    platformRole: PlatformRole.USER,
    nip: '1',
    jabatan: 'J',
    pangkat: 'P',
    nohp: '6281234567890',
    sesiTokenVersion: 0,
    refreshTokenHash: null,
    refreshTokenExpiresAt: null,
    passwordChangedAt: null,
    ttePinHash: null,
    tteP12Base64: null,
    tteP12PassphraseEncrypted: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    repository = {
      findPjEvaluatorOrganisasiOpdId: jest.fn().mockResolvedValue('opd-biro'),
      findPjEvaluatorOrganisasiOpd: jest
        .fn()
        .mockResolvedValue({ opdId: 'opd-biro', nama: 'Biro' }),
      findEvaluatorsByOpd: jest.fn().mockResolvedValue([baseRow]),
      findEvaluatorByIdInOpd: jest.fn().mockResolvedValue(baseRow),
      findEvaluatorAktifById: jest.fn().mockResolvedValue(baseRow),
      createPengguna: jest.fn(),
      updateEvaluator: jest.fn(),
      softDeleteEvaluator: jest.fn(),
      existsEmailOtherThan: jest.fn(),
      existsNipOtherThan: jest.fn(),
    } as never;

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [EvaluatorService, { provide: PenggunaRepository, useValue: repository }],
    }).compile();
    service = moduleRef.get(EvaluatorService);
  });

  it('seharusnya mengembalikan evaluator pada OPD evaluator organisasi', async () => {
    await expect(service.findAll()).resolves.toBeDefined();
  });

  it('seharusnya melempar NotFoundException jika evaluator organisasi tidak memiliki OPD', async () => {
    repository.findPjEvaluatorOrganisasiOpdId.mockResolvedValue(null);
    await expect(service.findAll()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('seharusnya menolak create jika OPD tidak tersedia', async () => {
    repository.findPjEvaluatorOrganisasiOpdId.mockResolvedValue(null);
    await expect(
      service.create({
        email: 'new@example.test',
        nama: 'New',
        nip: '2',
        jabatan: 'J',
        pangkat: 'P',
        nohp: '6281234567891',
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('seharusnya menolak create dengan email yang sudah digunakan', async () => {
    repository.existsEmailOtherThan.mockResolvedValue(true);
    await expect(
      service.create({
        email: 'new@example.test',
        nama: 'New',
        nip: '2',
        jabatan: 'J',
        pangkat: 'P',
        nohp: '6281234567891',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('seharusnya menolak create dengan NIP yang sudah digunakan', async () => {
    repository.existsEmailOtherThan.mockResolvedValue(false);
    repository.existsNipOtherThan.mockResolvedValue(true);
    await expect(
      service.create({
        email: 'new@example.test',
        nama: 'New',
        nip: '2',
        jabatan: 'J',
        pangkat: 'P',
        nohp: '6281234567891',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('seharusnya meneruskan Prisma P2002 sebagai ConflictException', async () => {
    repository.existsEmailOtherThan.mockResolvedValue(false);
    repository.existsNipOtherThan.mockResolvedValue(false);
    repository.createPengguna.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplikat', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );
    await expect(
      service.create({
        email: 'new@example.test',
        nama: 'New',
        nip: '2',
        jabatan: 'J',
        pangkat: 'P',
        nohp: '6281234567891',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('seharusnya menolak update kosong', async () => {
    await expect(service.update(baseRow.penggunaId, {})).rejects.toBeInstanceOf(BadRequestException);
  });

  it('seharusnya melempar NotFoundException ketika evaluator tidak ditemukan', async () => {
    repository.findEvaluatorByIdInOpd.mockResolvedValue(null);
    await expect(service.update('missing', { nama: 'X' })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('seharusnya hash password default ketika membuat evaluator', async () => {
    repository.existsEmailOtherThan.mockResolvedValue(false);
    repository.existsNipOtherThan.mockResolvedValue(false);
    repository.createPengguna.mockResolvedValue(baseRow);
    await service.create({
      email: 'new@example.test',
      nama: 'New',
      nip: '2',
      jabatan: 'J',
      pangkat: 'P',
      nohp: '6281234567891',
    });
    expect(bcrypt.hash).toHaveBeenCalledWith(DEFAULT_PENGGUNA_PASSWORD, BCRYPT_SALT_ROUNDS);
  });
});
