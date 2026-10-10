# dz-format

Validate and parse Algerian formats: phone numbers, CCP accounts, RIP and RIB
keys, vehicle plates, postal codes, NIN, NIF, NIS, RC numbers, wilayas and
communes. The Python twin of the npm package
[@syscli/dz-format](https://github.com/syscli/dz-format): same rules, same
answers, checked in CI against the npm package on thousands of inputs.

```sh
pip install dz-format
pip install "dz-format[place]"   # for wilaya and commune names
```

```python
from dz_format import phone, rip, rip_of, ccp, rib, plate, postal_code, rc

phone("0661 23 45 67")
# {"valid": True, "value": "+213661234567", "national": "0661234567",
#  "type": "mobile", "operator": "Mobilis"}

rip_of("200")                       # "00799999000000020091"
rib("002 00112 1123000001 47")      # {"valid": False, "reason": "key"}
plate("12345 116 16")["year"]       # 2016
rc("01B 0015609-16/00")["canonical"]  # "16/00-0015609 B 01"

from dz_format.place import commune
commune("El Marsa")                 # ambiguous, with 3 suggestions
commune("El Marsa", wilaya="Alger") # valid, code "1640"
```

Every function takes values the way people type them (spaces, dashes, +213,
Arabic-Indic digits) and returns a dict: the parts of a valid value, or the
reason it was rejected (empty, chars, length, prefix, key, range, unknown,
ambiguous, format).

Valid means well formed, not that the account, line or company exists. The
source of every rule is listed in
https://github.com/syscli/dz-format/blob/main/sources/README.md. The RIB key
leaves out the bank code: it is not the French RIB key.

Try it in the browser: https://syscli.github.io/dz-format/

No dependencies (syscli-algeria for the place module). Python 3.9 or later.

## License

MIT
