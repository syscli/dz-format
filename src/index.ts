export type { Invalid, Reason, Result } from "./result.js";
export { asciiDigits } from "./normalize.js";
export {
  ccp,
  ccpKey,
  formatRib,
  POSTE_AGENCY,
  POSTE_BANK,
  rib,
  ribKey,
  rip,
  ripOf,
  type Ccp,
  type Rib,
  type Rip,
} from "./bank.js";
export { nif, nin, nis, postalCode, rc, type Nif, type Nin, type Nis, type PostalCode, type Rc } from "./ids.js";
export { formatPhone, phone, type Phone, type PhoneType } from "./phone.js";
export { formatPlate, plate, UNKNOWN_YEAR, type Plate, type PlateCategory } from "./plate.js";
export { wilayaCode, type WilayaCode, type WilayaMap } from "./wilaya.js";
