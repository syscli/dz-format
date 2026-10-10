# Sources

Where each rule comes from, and how it was checked. When a rule rests on a
secondary source, it says so.

## RIB and RIP key

A RIB has 20 digits: bank (3), agency (5), account (10), key (2). A RIP is
the RIB of a CCP account, with bank 007 (Algerie Poste) and agency 99999.

Key: 97 minus the remainder of the 17-digit number agency + account + "00"
by 97. The bank code is not part of the computation. This differs from the
French RIB key, which many Algerian tools copy and which gives wrong keys
here.

No official specification was found online. The rule was derived from, and
checked against, every RIB below. All are accounts published by public
bodies for donations, with the key printed by the bank:

| RIB | holder | published in |
|---|---|---|
| 007 99999 0000000200 91 | Algerie Poste, COVID-19 solidarity fund | poste.dz, 2020 |
| 002 00112 1123000001 46 | BEA, COVID-19 fund (EUR) | BEA RIB sheet, Algerian consulate in Nantes, April 2020 |
| 002 00112 1123000002 43 | BEA, COVID-19 fund (USD) | same sheet |
| 002 00112 1123000003 40 | BEA, COVID-19 fund (GBP) | same sheet |
| 001 00627 0300300180 36 | BNA, CDER | cder.dz bank details |

- https://www.poste.dz/news/s/operation-de-solidarite-nationale-pour-la-lutte-contre-le-corona-virus-covid-19
- https://consulat-nantes-algerie.fr/wp-content/uploads/2020/04/RIB_COVID19.pdf
- https://www.cder.dz/evenements/Download/banque.pdf

The Python package `algeria` (PyPI, github.com/mouh2020/algeria) uses the
same rule for RIPs, written with the constant 85 (the agency 99999 shifted
into place, mod 97).

## CCP key

Account padded to 10 digits, digits weighted 4, 5, 6 ... 13 from the right,
summed; the key is the last two digits of the sum.

- Algerie Poste publishes CCP 200 with key 12 (same page as above).
- University of Jijel, algorithmics exam S1 2024-2025, gives the method with
  two worked examples (17756415 key 75, 9536503 key 43). Secondary source.

## Phone numbers

Country code 213, trunk prefix 0, closed plan. Mobile: 9 national digits
starting with 5 (Ooredoo), 6 (Mobilis) or 7 (Djezzy). Landline: 8 national
digits starting with a two-digit area code in the 2x, 3x and 4x ranges. 9 is
reserved for VoIP, 9 national digits.

- ITU, national numbering plan of Algeria: https://www.itu.int/oth/T0202000003/en
- ARPCE: https://www.arpce.dz

Area codes are returned as written and not checked against a list, since the
published lists date from 2008.

## Vehicle plates

Normal series, read from right to left: wilaya code (2 digits), year of
first registration (2 digits), category (1 digit), order number. Year 33 is
printed when the year is unknown. Categories: 1 tourisme, 2 camion,
3 camionnette, 4 autocar and autobus, 5 tracteur routier, 6 other tractors,
7 special vehicles, 8 remorque and semi-remorque, 9 motocyclette.

- Arrete of 5 May 1988 on vehicle registration, amended by the arrete of
  4 December 2022 (JORADP of 17 January 2023).
- Arrete published on 17 June 2026 giving codes 59 to 69 to the wilayas
  created by loi 26-06, in force from 1 January 2027.
- Read through press reports of these texts (TSA, Algerie360). The text of
  the arretes should be checked in the JORADP itself.

Not covered: the temporary series (W, WW) and public works plates (arrete of
30 June 1988).

## Wilaya codes

48 wilayas under loi 84-09 (1984), 58 under loi 19-12 (2019), 69 under
loi 26-06 (2026). The full data, with names and communes, is in
https://github.com/syscli/algeria.
