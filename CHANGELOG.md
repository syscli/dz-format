# Changelog

This project follows semantic versioning. Before 1.0, a minor version may
change the API; a patch version never does.

## 0.1.0 - unreleased

First release.

- `phone`, `formatPhone`: mobile, landline and VoIP numbers, national or
  international, with the operator of mobile ranges.
- `ccp`, `ccpKey`: CCP account numbers and their key.
- `rip`, `ripOf`, `rib`, `ribKey`, `formatRib`: RIP and RIB keys. The key
  leaves out the bank code, as checked against accounts published by
  Algerie Poste, BEA and BNA.
- `plate`, `formatPlate`: vehicle plates of the normal series, wilaya codes
  up to 69.
- `wilayaCode`: wilaya codes under the 48, 58 and 69 maps.
- Arabic-Indic digits are accepted everywhere.
