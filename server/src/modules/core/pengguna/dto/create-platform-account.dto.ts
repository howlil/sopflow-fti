import { CreatePenggunaProfilDto } from './create-pengguna-profil.dto';

/** Target FTI account provisioning intentionally hides legacy organisasi/workflow-role fields. */
export class CreatePlatformAccountDto extends CreatePenggunaProfilDto {}
