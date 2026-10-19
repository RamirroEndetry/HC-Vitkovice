# Vítkovice VIP

Responzivní interaktivní prototyp VIP tipovací soutěže. Bez instalace závislostí; statický obsah je v `dist/`.

## Lokální spuštění

`python -m http.server 5173 --directory dist`

## GitHub a Cloudflare

Repozitář: https://github.com/RamirroEndetry/HC-Vitkovice

Konfigurace `wrangler.jsonc` připravuje statický prototyp pro Cloudflare Workers Static Assets. V Cloudflare lze propojit tento GitHub repozitář přes Workers Builds, bez sestavovacího kroku, s deploy příkazem `npx wrangler deploy`. Před nasazením je potřeba vybrat účet Cloudflare a autorizovat GitHub integraci. Alternativně po přihlášení přes `npx wrangler login` použijte `npm run deploy`. Samotné přidání konfigurace aplikaci nenasazuje ani nezajišťuje VIP přístup. Prototyp neobsahuje soukromé údaje ani přístupové klíče.

Kontroly: `npm run check`. Testy používají pevný čas, nezávisí na aktuálním datu.

## Hotové v prototypu

- Přehled, domácí zápasy, místní historie tipů, ukázkový žebříček a výběr hráčů.
- Tip 1/X/2, nepovinné přesné skóre, nad/pod 5,5 gólu; vše za 60 minut.
- Úprava a ukládání tipů v localStorage. Uzávěrka podle termínu zápasu, kontrola při uložení.
- Časy zobrazované v Europe/Prague.
- Logo a odkazy z oficiálního klubového webu. Rozpis a výběr hráčů ověřen 19. 10. 2026.

## Před produkčním spuštěním

Tento prototyp nemá autentizaci ani zabezpečení pro reálnou VIP soutěž. Veškeré kontroly jsou klientské a údaje lze změnit v prohlížeči. Žebříček je ukázkový, body se nevyhodnocují, výsledky nejsou synchronizované a profily odkazují na oficiální soupisku.

Doporučená produkční architektura: GitHub pro zdrojový kód a automatické nasazení, Cloudflare Workers pro API a serverové ověřování uzávěrek, D1 pro uživatele, pozvánky, zápasy a tipy. Přihlášení přes ověřenou e-mailovou pozvánku s kontrolou VIP seznamu. Administrace a audit změn výsledků. Integraci Tipsportu realizovat až po ověření dostupného datového přístupu; zatím neexistuje žádné napojení.

Potvrdit s klientem: bodování, ceny, VIP seznam, pravidla shodného pořadí, odložených zápasů a změn termínu. Návrh je bez peněžních vkladů.

Zdroje: https://www.hc-vitkovice.cz/ a https://www.hc-vitkovice.cz/soupiska/MUZ
