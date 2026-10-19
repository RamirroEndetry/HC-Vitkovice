# Vítkovice VIP – dotykový kiosek

Webový prototyp pro sdílenou obrazovku ve VIP zóně. Repozitář: https://github.com/RamirroEndetry/HC-Vitkovice

## Návštěvník

1. Úvodní spořič „Dotkni se obrazovky“.
2. Jedna karta konkrétního zápasu s týmy, termínem a odpočtem do otevření tipování. Návštěvník utkání nevybírá; zadá jméno, výsledek 1/X/2, povinné přesné skóre a volitelně počet gólů (0–5 / 6 a více).
3. Po potvrzení poděkování; za 12 sekund čistý úvod pro dalšího návštěvníka. Po 90 sekundách nečinnosti se rozpracovaný formulář vymaže.
4. Vstup „Výsledky a vítězové“ zobrazí vítěze a informaci o vyzvednutí ceny ve VIP zóně.

Veškeré tipy jsou za základní hrací dobu, bez prodloužení a nájezdů. Tipování se automaticky OTEVŘE v plánovaném začátku zápasu a běží do konce 3. třetiny. Uzavření po 3. třetině potvrzuje obsluha; neodvozuje se z 60 minut běžného času, protože hokej má přestávky a přerušení. Bez potvrzení obsluhy zůstává tipování otevřené i po skutečném konci třetiny. Živý stav utkání zatím není připojený. Stav soutěže se kontroluje také při odeslání. Každý návštěvník má samostatný záznam; potvrzení záznam nenahrazuje. Jeden tip na normalizované jméno a zápas na tomto zařízení. Ověření totožnosti ani synchronizace dalších kiosků zatím neexistuje. Staré tipy předchozího osobního prototypu se do kioskové soutěže nepřenášejí.

## Obsluha a vyhodnocení

Otevřete `/#obsluha`. Zvolte aktivní utkání pro celou VIP zónu. Volba se ukládá na tomto zařízení a po obnovení stránky zůstane stejné utkání i po jeho začátku nebo skončení; kiosek nepřeskočí na další zápas. Při úplně prvním spuštění se předvybere nejbližší budoucí zápas (pokud žádný není, poslední uvedený); obsluha jej před akcí ověří. Návštěvnické obrazovky nemají výběr zápasu.

Při konci 3. třetiny stiskněte **Konec 3. třetiny — uzavřít tipy**. Uzavření se uloží a již nelze přidávat tipy ani po restartu. Potom zadejte ověřené skóre po 60 minutách a potvrďte vyhodnocení. Před uzavřením tipování nelze výsledek potvrdit. Potvrzený výsledek je v UI uzamčený.

Vyhrává nejmenší součet absolutních odchylek domácího a hostujícího skóre; přesný tip má odchylku nula. Při shodě rozhoduje správný volitelný tip na počet gólů, pak se vyhlásí všichni společně. Výběr 1/X/2 musí odpovídat zadanému skóre; nepřiděluje samostatné body. Bez tipů není vyhlášen vítěz. Pravidla, rozdělení cen při shodě a postup při odložení musí potvrdit pořadatel.

## Omezení prototypu

Data jsou pouze v localStorage tohoto prohlížeče; při vymazání úložiště se ztratí. Administrace není chráněna přihlášením a není vhodná k ostré soutěži. Jména nejsou ověřená. Před sběrem skutečných návštěvníků je potřeba serverová databáze, přihlášení obsluhy, serverové uzávěrky a pravidla zpracování a uchování jmen. Výsledky zadává obsluha ručně, Tipsport není připojen. Rozpis je statický, ověřený 19. 10. 2026; termíny se nesynchronizují. Nejde o nasazenou produkční soutěž.

Výběr hráčů je zachovaný v `dist/data.js` pro další rozšíření. Nový kiosek se soustředí na zadání tipů a vyhlášení vítězů.

## Spuštění a kontroly

- `python -m http.server 5173 --directory dist`
- `npm run check` – testy vyhodnocování a toku kiosku s pevným časem.
- `npm run dev` – místní Cloudflare náhled přes Wrangler.

## Cloudflare

`wrangler.jsonc` připravuje Workers Static Assets. V Cloudflare připojte GitHub repozitář přes Workers Builds, bez sestavovacího kroku, s příkazem `npx wrangler deploy`. Alternativně po `npx wrangler login` spusťte `npm run deploy`. Samotná konfigurace neprovádí nasazení ani nezajišťuje VIP přístup.

Zdroje loga, rozpisu a hráčů: https://www.hc-vitkovice.cz/ a https://www.hc-vitkovice.cz/soupiska/MUZ
