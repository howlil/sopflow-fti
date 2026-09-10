const forge = require('node-forge');
const crypto = require('crypto');

const passphrase =
  process.argv[2] ??
  process.env.PDF_SIGNING_P12_PASSPHRASE ??
  crypto.randomBytes(16).toString('hex');

const now = new Date();
const validFrom = new Date(now.getTime() - 5 * 60 * 1000);
const expiresAt = new Date(now);
expiresAt.setFullYear(now.getFullYear() + 5);

function serial(suffix) {
  return `${new Date().getTime().toString(16)}${suffix}`;
}

const caKeys = forge.pki.rsa.generateKeyPair({ bits: 2048, workers: 2 });
const signingKeys = forge.pki.rsa.generateKeyPair({ bits: 2048, workers: 2 });

const orgName = process.argv[4] ?? process.env.CERT_ORG_NAME ?? 'Fakultas Teknologi Informasi';
const ouName = process.argv[5] ?? process.env.CERT_OU_NAME ?? 'SOPFlow FTI';
const commonName = process.argv[3] ?? 'SOPFlow FTI Penandatangan PDF';

const caAttrs = [
  { name: 'commonName', value: `Root CA ${commonName}` },
  { name: 'organizationName', value: orgName },
  { name: 'organizationalUnitName', value: ouName },
  { name: 'countryName', value: 'ID' },
];

const signingAttrs = [
  { name: 'commonName', value: commonName },
  { name: 'organizationName', value: orgName },
  { name: 'organizationalUnitName', value: ouName },
  { name: 'countryName', value: 'ID' },
];

const caCert = forge.pki.createCertificate();
caCert.publicKey = caKeys.publicKey;
caCert.serialNumber = serial('ca');
caCert.validity.notBefore = validFrom;
caCert.validity.notAfter = expiresAt;
caCert.setSubject(caAttrs);
caCert.setIssuer(caAttrs);
caCert.setExtensions([
  { name: 'basicConstraints', cA: true },
  { name: 'keyUsage', keyCertSign: true, cRLSign: true, digitalSignature: true },
  { name: 'subjectKeyIdentifier' },
]);
caCert.sign(caKeys.privateKey, forge.md.sha256.create());

const signingCert = forge.pki.createCertificate();
signingCert.publicKey = signingKeys.publicKey;
signingCert.serialNumber = serial('01');
signingCert.validity.notBefore = validFrom;
signingCert.validity.notAfter = expiresAt;
signingCert.setSubject(signingAttrs);
signingCert.setIssuer(caAttrs);
signingCert.setExtensions([
  { name: 'basicConstraints', cA: false },
  { name: 'keyUsage', digitalSignature: true, nonRepudiation: true },
  { name: 'extKeyUsage', codeSigning: true, emailProtection: true },
  {
    name: 'authorityKeyIdentifier',
    keyIdentifier: caCert.generateSubjectKeyIdentifier().getBytes(),
  },
  { name: 'subjectKeyIdentifier' },
]);
signingCert.sign(caKeys.privateKey, forge.md.sha256.create());

const p12Asn1 = forge.pkcs12.toPkcs12Asn1(signingKeys.privateKey, [signingCert, caCert], passphrase, {
  algorithm: '3des',
  friendlyName: 'SOPFlow FTI PDF Signing Certificate',
});
const p12Der = forge.asn1.toDer(p12Asn1).getBytes();
const p12Base64 = Buffer.from(p12Der, 'binary').toString('base64');

console.log('PDF_SIGNING_ENABLED=true');
console.log(`PDF_SIGNING_P12_PASSPHRASE=${passphrase}`);
console.log(`PDF_SIGNING_P12_BASE64=${p12Base64}`);
