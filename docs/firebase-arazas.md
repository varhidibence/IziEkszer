# Firebase árazás – IziÉkszer projekt

> Utoljára ellenőrizve: 2026. szeptember

## Spark plan (ingyenes) – bankkártya nélkül

| Szolgáltatás | Ingyenes limit |
|---|---|
| Authentication | 50 000 aktív user/hó |
| Firestore olvasás | 50 000/nap |
| Firestore írás | 20 000/nap |
| Firestore tárhely | 1 GB |
| Hosting | 10 GB tárhely, 360 MB/nap traffic |

**Fontos:** Cloud Storage (képfeltöltés) 2026. február óta NEM elérhető Spark plan-en. Blaze plan kell hozzá.

## Blaze plan (pay-as-you-go) – bankkártya szükséges

Tartalmazza az összes Spark ingyenes limitet, felette fizetsz:

| Szolgáltatás | Ár |
|---|---|
| Firestore olvasás | $0.03 / 100 000 |
| Firestore írás | $0.09 / 100 000 |
| Firestore törlés | $0.01 / 100 000 |
| Firestore tárhely | $0.15 / GB / hó |
| Cloud Storage tárhely | 5 GB/hó ingyenes, utána $0.02/GB |
| Cloud Storage forgalom | 1 GB/nap ingyenes, utána $0.12/GB |

## Erre a projektre vetítve

### Spark plan elég, ha:
- Csak szöveg/adat szerkesztés (árak, események, promo szöveg) – Firestore
- Képeket nem admin felületről töltünk fel, hanem a GitHub repóba

### Blaze plan kell, ha:
- Termékképeket az admin felületről akarunk feltölteni (Cloud Storage)

### Várható valós költség:
Napi néhány száz látogató esetén a Firestore olvasások töredékét sem érik el a napi limitnek.
Blaze plan-en is várható havi számla: **$0–1**.

## Tervezett adatstruktúra (Firestore)

```
/config
  /promo        →  { szoveg: "...", aktiv: true }
  /arak         →  { universal_1db: 7500, universal_par: 14000, system75_par: 17000 }

/esemenyek
  /[id]         →  { cim, helyszin, datum }

/termekek
  /[id]         →  { nev, ar, kep, kategoria }   // kategoria: "ekszer-futar" | "charm-bar"
```

## Döntés

Kezdés: **Spark plan** – képek a GitHub repóban.
Ha webshop képfeltöltés kell: váltás Blaze-re (várható költség minimális).

## Források
- https://firebase.google.com/pricing
- https://blog.back4app.com/firebase-pricing/
- https://agentdeals.dev/vendor/firebase
