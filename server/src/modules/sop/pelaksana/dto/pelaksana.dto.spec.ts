import { validate } from 'class-validator';
import { CreatePelaksanaDto } from './create-pelaksana.dto';
import { UpdatePelaksanaDto } from './update-pelaksana.dto';

describe('DTO Pelaksana global catalog', () => {
  it('accepts a reusable actor name without organizational ownership fields', async () => {
    const dto = new CreatePelaksanaDto();
    Object.assign(dto, { namaPelaksana: 'Dosen' });
    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects empty actor names on create and update', async () => {
    const createDto = new CreatePelaksanaDto();
    Object.assign(createDto, { namaPelaksana: '' });
    const updateDto = new UpdatePelaksanaDto();
    Object.assign(updateDto, { namaPelaksana: '' });

    expect((await validate(createDto)).map((error) => error.property)).toContain('namaPelaksana');
    expect((await validate(updateDto)).map((error) => error.property)).toContain('namaPelaksana');
  });

  it('enforces the current database-backed 15 character actor label limit', async () => {
    const valid = new UpdatePelaksanaDto();
    Object.assign(valid, { namaPelaksana: 'x'.repeat(15) });
    await expect(validate(valid)).resolves.toHaveLength(0);

    const invalid = new UpdatePelaksanaDto();
    Object.assign(invalid, { namaPelaksana: 'x'.repeat(16) });
    expect((await validate(invalid)).map((error) => error.property)).toContain('namaPelaksana');
  });

  it('rejects non-string actor names', async () => {
    const dto = new UpdatePelaksanaDto();
    Object.assign(dto, { namaPelaksana: 123 });
    expect((await validate(dto)).map((error) => error.property)).toContain('namaPelaksana');
  });
});
